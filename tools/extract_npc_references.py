"""Extract requested NPC static, named placements from the user's installed game.

Reuses upstream archives/MSB/params/projection. Does not evaluate spawn conditions
or claim a current NPC position. Output is private generated data/npcs.json.
"""
import argparse
import json
import math
import os
import subprocess
import sys

from erlib import dcx, msb, emevd, oodle, param, paramdef
from erlib.dvdbnd import DvdBnd
from erlib import modfiles
from erlib.gamepath import require_game_dir
from build_markers import LegacyConv, place, load_names, LOCALES, nearest_marker

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--game-dir')
    parser.add_argument('--mod-dir')
    parser.add_argument('--npc-name', action='append', help='Exact English NPC name; repeat to select more')
    args = parser.parse_args()
    game = require_game_dir(args.game_dir)
    mod = modfiles.find_mod_dir(args.mod_dir)
    map_list = os.path.join(ROOT, 'cache', 'map-list.txt')
    if not os.path.exists(map_list):
        env = {**os.environ, 'ER_GAME_DIR': game, **({'ER_MOD_DIR': mod} if mod else {})}
        subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'enumerate_maps.py')], env=env, check=True)
    dvd = DvdBnd(game, cache_dir=os.path.join(ROOT, 'cache'), verbose=False)
    helper = oodle.make_helper(game)
    names = load_names(dvd, helper, mod)
    params = param.load_params(modfiles.regulation_path(game, mod))
    # Format fact checked against Paramdex ER NpcParam.xml and installed row size.
    # Do not silently apply an offset to an unsupported layout.
    if params['NpcParam'].row_size != 736:
        raise ValueError('Unsupported NpcParam row layout; expected 736 bytes')
    import struct
    requested = set(args.npc_name or ['Millicent', 'Adan, Thief of Fire'])
    name_ids = {key for key, value in names['en'].get('NpcName', {}).items() if value in requested}
    all_name_ids = {row.id: struct.unpack_from('<i', row.data, 0x0c)[0] for row in params['NpcParam'].rows}
    npc_ids = {row_id: name_id for row_id, name_id in all_name_ids.items() if name_id in name_ids}
    if not npc_ids:
        raise ValueError('No validated name-to-NpcParam mapping for requested NPCs')
    conv_def = paramdef.load(os.path.join(ROOT, 'data', 'paramdefs', 'WorldMapLegacyConvParam.xml'))
    conv = LegacyConv(params['WorldMapLegacyConvParam'].rows, conv_def)
    with open(os.path.join(ROOT, 'data', 'markers.json'), encoding='utf-8') as file:
        landmarks = [marker for marker in json.load(file)['markers'] if marker['cat'] in ('grace', 'poi')]
    output = []
    with open(map_list, encoding='utf-8') as file:
        maps = sorted(set(line.split('\t')[0] for line in file if line.strip()) | set(modfiles.loose_map_ids(mod)))
    scanned = 0
    for map_id in maps:
        area, block, cell, tier = (int(map_id[1:3]), int(map_id[4:6]), int(map_id[7:9]), int(map_id[10:12]))
        if area in (60, 61) and tier:
            continue
        layout = msb.load(dcx.decompress(modfiles.read(dvd, mod, f'/map/mapstudio/{map_id}.msb.dcx'), oodle=helper))
        scanned += 1
        placements = []
        for offset, part_name in layout.entries('PARTS_PARAM_ST'):
            record = msb.enemy_placement(layout, offset)
            if record:
                placements.append({**record, 'part': part_name})
        event_path = f'/event/{map_id}.emevd.dcx'
        linked = emevd.named_human_entities(dcx.decompress(modfiles.read(dvd, mod, event_path), oodle=helper), placements, name_ids) if modfiles.has(dvd, mod, event_path) else {}
        for record in placements:
            part_name = record['part']
            linked_name, instruction = linked.get(record['entityId'], (None, None))
            name_id = npc_ids.get(record['npcParamId']) or linked_name
            if name_id is None:
                continue
            param_name = all_name_ids.get(record['npcParamId'], -1)
            if record['npcParamId'] not in npc_ids and param_name > 0 and param_name not in name_ids:
                continue  # Never override a contradictory named NPC with an event guess.
            x, y, z = record['position']
            point = place(area, block, cell, x, y, z, conv)
            if not point or not all(math.isfinite(value) for value in (point[0], point[1], point[3])):
                continue
            px, py, master, height = point
            if not 0 <= px <= 10496 or not 0 <= py <= 10496:
                continue
            near = nearest_marker(landmarks, master, px, py, 1500)
            name_source = 'NpcParam.nameId' if record['npcParamId'] in npc_ids else 'EMEVD initialization call / unique named human entity'
            output.append({
                'id': f"npc-reference:{map_id}:{record['entityId']}:{part_name}",
                'cat': 'npc', 'names': {locale: names[locale].get('NpcName', {}).get(name_id) or names['en']['NpcName'][name_id] for locale in LOCALES},
                'aliases': ['Milicent'] if names['en']['NpcName'][name_id] == 'Millicent' else [], 'master': master, 'px': round(px, 1), 'py': round(py, 1), 'h': round(height), 'map': map_id,
                'reference': {'status': 'unknown', 'source': 'local-game-layout', 'kind': 'static-placement',
                    'locationNames': near['names'] if near else {}, 'nearbyMarkerId': near['id'] if near else None,
                    'entityId': record['entityId'], 'npcParamId': record['npcParamId'], 'npcNameId': name_id,
                    'talkId': record['talkId'], 'part': part_name, 'nameSource': name_source, 'instructionIndex': instruction,
                    'explanation': 'Posição estática identificada no jogo. Condições de aparição, papel e posição atual não foram avaliados.'},
            })
    dvd.close()
    target = os.path.join(ROOT, 'data', 'npcs.json')
    with open(target, 'w', encoding='utf-8') as file:
        json.dump({'locales': list(LOCALES), 'markers': output}, file, ensure_ascii=False)
    print(f'{scanned} maps scanned; {len(output)} named NPC placements -> {target}')


if __name__ == '__main__':
    main()
