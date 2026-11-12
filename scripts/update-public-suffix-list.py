#!/usr/bin/env python3
"""Refresh the offline Public Suffix List from its official source or a local copy."""
import argparse
import json
from pathlib import Path
from urllib.request import urlopen

SOURCE = "https://publicsuffix.org/list/public_suffix_list.dat"
ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, help="Use an already downloaded .dat file")
    args = parser.parse_args()
    if args.source:
        source = args.source.read_text(encoding="utf-8")
    else:
        with urlopen(SOURCE, timeout=30) as response:
            source = response.read().decode("utf-8")
    if "// ===BEGIN ICANN DOMAINS===" not in source or "// ===END PRIVATE DOMAINS===" not in source:
        raise ValueError("The source is not a complete Public Suffix List")
    metadata = [line for line in source.splitlines() if line.startswith(("// VERSION:", "// COMMIT:"))]
    rules = [line.strip() for line in source.splitlines() if line.strip() and not line.startswith("//")]
    header = """// Public Suffix List — https://publicsuffix.org/list/public_suffix_list.dat
// Mozilla Public License 2.0: https://mozilla.org/MPL/2.0/
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.
// Local snapshot for offline domain extraction; includes ICANN and PRIVATE rules.
"""
    output = header + "\n".join(metadata) + "\nconst PUBLIC_SUFFIX_RULES = "
    output += json.dumps(rules, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (ROOT / "js/public-suffix-list.js").write_text(output, encoding="utf-8")
    print(f"Updated {len(rules)} local suffix rules. Run node tests/url-guide.test.cjs next.")


if __name__ == "__main__":
    main()
