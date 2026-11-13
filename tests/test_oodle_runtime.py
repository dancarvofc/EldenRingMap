import os
import pathlib
import sys
import tempfile
import types
import unittest
from unittest.mock import patch
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'tools'))
from erlib import oodle

class OodleRuntimeTests(unittest.TestCase):
    def test_runtime_is_scoped_to_library_loading_and_cwd_is_restored(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=pathlib.Path(temporary);(root/'build').mkdir();(root/'runtime').mkdir()
            (root/'runtime'/'oo2core_8_win64.dll').touch()
            seen=[]
            class Function: pass
            def load(_path):
                seen.append(os.getcwd());return types.SimpleNamespace(OodleLZ_Decompress=Function())
            before=os.getcwd()
            with patch.dict(os.environ,{'ER_LINOODLE':str(root/'build'/'liblinoodle.so'), 'ER_OODLE_RUNTIME':str(root/'runtime')}),patch.object(oodle,'_fn',None),patch.object(oodle,'_handle',None),patch.object(oodle.ctypes,'CDLL',load):
                oodle.load()
            self.assertEqual(seen,[str(root/'runtime')]);self.assertEqual(os.getcwd(),before)
    def test_missing_runtime_is_reported_before_native_loading(self):
        with tempfile.TemporaryDirectory() as temporary:
            with patch.dict(os.environ,{'ER_LINOODLE':temporary+'/build/library.so', 'ER_OODLE_RUNTIME':temporary+'/runtime'}),patch.object(oodle,'_fn',None),patch.object(oodle.ctypes,'CDLL') as load:
                with self.assertRaises(RuntimeError):oodle.load()
                load.assert_not_called()

if __name__=='__main__':unittest.main()
