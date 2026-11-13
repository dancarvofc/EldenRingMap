import pathlib
import struct
import sys
import unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'tools'))
from erlib.emevd import instructions, named_human_entities

class EventReferenceTests(unittest.TestCase):
    def sample(self, words):
        blob=bytearray(256)
        blob[:8]=b'EVD\0\0\xff\1\xff'
        struct.pack_into('<I',blob,8,0xCD)
        struct.pack_into('<qq',blob,32,1,144)
        struct.pack_into('<qq',blob,112,len(words)*4,176)
        struct.pack_into('<iiqqq',blob,144,2000,6,len(words)*4,0,-1)
        struct.pack_into('<'+'I'*len(words),blob,176,*words)
        return blob
    def test_unique_named_entity_in_initialization_call_is_only_a_reference(self):
        data=self.sample([0,900,123,456])
        parts=[{'part':'c0000_synthetic','entityId':123}]
        self.assertEqual(named_human_entities(data,parts,{456}),{123:(456,0)})
        self.assertEqual(next(instructions(data))[1:3],(2000,6))
    def test_ambiguous_or_nonhuman_entities_are_not_guessed(self):
        data=self.sample([0,123,124,456,457])
        self.assertEqual(named_human_entities(data,[{'part':'c0000_a','entityId':123},{'part':'c0000_b','entityId':124}],{456}),{})
        self.assertEqual(named_human_entities(data,[{'part':'c0000_a','entityId':123}],{456,457}),{})
        self.assertEqual(named_human_entities(data,[{'part':'c1000_dummy','entityId':123}],{456}),{})
        self.assertEqual(named_human_entities(data,[{'part':'c0000_unassigned','entityId':0}],{456}),{})
    def test_malformed_arguments_and_unsupported_layouts_fail_closed(self):
        with self.assertRaises(ValueError): list(instructions(b'unknown'))
        data=self.sample([456]);struct.pack_into('<q',data,160,10000)
        with self.assertRaises(ValueError): list(instructions(data))

if __name__=='__main__': unittest.main()
