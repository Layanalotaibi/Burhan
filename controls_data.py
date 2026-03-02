"""
Hierarchy Data for NCA ECC Controls
Loads the structure from data/hierarchy.json (uploaded by user).
Structure: Domain > Sub-Domain > Control > Sub-Control > Expected Deliverables
"""

import os
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
HIERARCHY_FILE = os.path.join(DATA_DIR, "hierarchy.json")


def is_hierarchy_loaded() -> bool:
    """Check if a hierarchy JSON file has been uploaded."""
    return os.path.isfile(HIERARCHY_FILE)


def save_hierarchy(data: dict):
    """Validate and save hierarchy JSON to disk."""
    # Basic structure validation
    if "domain" not in data:
        raise ValueError("Missing 'domain' key")
    if "sub_domains" not in data:
        raise ValueError("Missing 'sub_domains' key")
    if not isinstance(data["sub_domains"], list):
        raise ValueError("'sub_domains' must be a list")

    domain = data["domain"]
    if "domain_id" not in domain or "name" not in domain:
        raise ValueError("'domain' must have 'domain_id' and 'name'")

    for sd in data["sub_domains"]:
        if "sub_domain_id" not in sd or "name" not in sd:
            raise ValueError("Each sub_domain must have 'sub_domain_id' and 'name'")
        if "controls" not in sd or not isinstance(sd["controls"], list):
            raise ValueError(f"Sub-domain '{sd.get('name')}' must have a 'controls' list")
        for ctrl in sd["controls"]:
            if "control_id" not in ctrl or "name" not in ctrl:
                raise ValueError("Each control must have 'control_id' and 'name'")
            if "sub_controls" not in ctrl or not isinstance(ctrl["sub_controls"], list):
                raise ValueError(f"Control '{ctrl.get('name')}' must have a 'sub_controls' list")
            for sc in ctrl["sub_controls"]:
                if "sub_control_id" not in sc or "name" not in sc:
                    raise ValueError("Each sub_control must have 'sub_control_id' and 'name'")
                if "expected_deliverables" not in sc or not isinstance(sc["expected_deliverables"], list):
                    raise ValueError(f"Sub-control '{sc.get('name')}' must have an 'expected_deliverables' list")
                for ed in sc["expected_deliverables"]:
                    if "deliverable_id" not in ed or "name" not in ed:
                        raise ValueError("Each deliverable must have 'deliverable_id' and 'name'")

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(HIERARCHY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _load_hierarchy() -> dict:
    """Load hierarchy from JSON file."""
    if not is_hierarchy_loaded():
        return None
    with open(HIERARCHY_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def get_hierarchy():
    """Return the full hierarchy structure, or None if not loaded."""
    return _load_hierarchy()


def get_all_deliverables():
    """Flatten hierarchy to get all deliverables with their context."""
    hierarchy = _load_hierarchy()
    if not hierarchy:
        return []

    deliverables = []
    domain = hierarchy["domain"]

    for sub_domain in hierarchy["sub_domains"]:
        for control in sub_domain["controls"]:
            for sub_control in control["sub_controls"]:
                for deliverable in sub_control["expected_deliverables"]:
                    deliverables.append({
                        "domain_id": domain["domain_id"],
                        "domain_name": domain["name"],
                        "sub_domain_id": sub_domain["sub_domain_id"],
                        "sub_domain_name": sub_domain["name"],
                        "control_id": control["control_id"],
                        "control_name": control["name"],
                        "sub_control_id": sub_control["sub_control_id"],
                        "sub_control_name": sub_control["name"],
                        "deliverable_id": deliverable["deliverable_id"],
                        "deliverable_name": deliverable["name"]
                    })

    return deliverables


def get_sub_control_by_id(sub_control_id: str):
    """Get sub-control details by ID."""
    hierarchy = _load_hierarchy()
    if not hierarchy:
        return None

    for sub_domain in hierarchy["sub_domains"]:
        for control in sub_domain["controls"]:
            for sub_control in control["sub_controls"]:
                if sub_control["sub_control_id"] == sub_control_id:
                    return {
                        "sub_control": sub_control,
                        "control": control,
                        "sub_domain": sub_domain,
                        "domain": hierarchy["domain"]
                    }
    return None
