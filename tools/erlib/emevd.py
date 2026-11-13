"""Minimal read-only ER EMEVD instruction records; no script execution.

Offsets are format facts cross-checked with SoulsFormatsNEXT EMEVD.cs and
Instruction.cs. Only little-endian, 64-bit ER/Sekiro-style version 0xCD is accepted.
"""
import struct


def instructions(data):
    if len(data) < 144 or data[:8] != b'EVD\x00\x00\xff\x01\xff' or struct.unpack_from('<I', data, 8)[0] != 0xCD:
        raise ValueError('Unsupported EMEVD layout')
    count, start = struct.unpack_from('<qq', data, 32)
    args_length, args_start = struct.unpack_from('<qq', data, 112)
    if count < 0 or start < 144 or start + count * 32 > len(data) or args_start < 144 or args_length < 0 or args_start + args_length > len(data):
        raise ValueError('Invalid EMEVD section bounds')
    for index in range(count):
        bank, opcode, length, offset, _layer = struct.unpack_from('<iiqqq', data, start + index * 32)
        if not length:
            continue
        if length < 0 or offset < 0 or offset + length > args_length:
            raise ValueError('Invalid EMEVD argument bounds')
        yield index, bank, opcode, data[args_start + offset:args_start + offset + length]


def named_human_entities(data, placements, requested_names):
    """Conservative static name references inside one initialization call.

    A single requested name and single human entity in that call are required.
    This does not resolve conditions, friendship, availability or current position.
    """
    output = {}
    for index, bank, opcode, args in instructions(data):
        if (bank, opcode) != (2000, 6) or len(args) % 4:
            continue
        words = set(struct.unpack('<' + 'I' * (len(args) // 4), args))
        names = words.intersection(requested_names)
        candidates = [record['entityId'] for record in placements
                      if record['part'].startswith('c0000_') and record['entityId'] > 0 and record['entityId'] in words]
        if len(names) != 1 or len(set(candidates)) != 1:
            continue
        entity = candidates[0]
        record = (next(iter(names)), index)
        if entity in output and output[entity][0] != record[0]:
            output[entity] = (None, None)
        elif entity not in output:
            output[entity] = record
    return {entity: record for entity, record in output.items() if record[0] is not None}
