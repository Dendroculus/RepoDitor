"""Compatibility imports for the shared capability-test fixture builder."""

from tools.capabilities.tests.unity_serialized_fixture import (
    UNITY_VERSION,
    align,
    aligned_string,
    mono_script,
    pptr,
    write_serialized_file,
)

__all__ = [
    "UNITY_VERSION",
    "align",
    "aligned_string",
    "mono_script",
    "pptr",
    "write_serialized_file",
]
