import pathlib
import struct
import sys
import unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'tools'))
from erlib.msb import MSB, enemy_placement

class PlacementTests(unittest.TestCase):
    def sample(self):
        m = MSB.__new__(MSB)
        m.data = bytearray(512)
        struct.pack_into('<i', m.data, 12, 2)
        struct.pack_into('<3f', m.data, 32, 10, 20, 30)
        struct.pack_into('<q', m.data, 96, 160)
        struct.pack_into('<q', m.data, 104, 192)
        struct.pack_into('<I', m.data, 160, 123)
        struct.pack_into('<ii', m.data, 204, 456, 789)
        return m
    def test_supported_static_record(self):
        result = enemy_placement(self.sample(), 0)
        self.assertEqual(result, {'entityId':123, 'npcParamId':456, 'talkId':789, 'position':(10,20,30)})
    def test_invalid_layouts_and_dummy_parts_do_not_become_npc_markers(self):
        for field, form, value in [(12,'<i',10),(104,'<q',99999),(96,'<q',-1),(32,'<f',float('nan'))]:
            m=self.sample();struct.pack_into(form,m.data,field,value)
            self.assertIsNone(enemy_placement(m,0))
        self.assertIsNone(enemy_placement(self.sample(),999))

if __name__ == '__main__':
    unittest.main()
