"""
ECC Controls Data for Burhan
Loads the NCA-ECC structure from data/ECC_data.json
Structure: Domain > Sub-Domain > Control > Expected Deliverables
"""

import os
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
ECC_FILE = os.path.join(DATA_DIR, "ECC_data.json")
# Keep backward compatibility with old hierarchy.json
HIERARCHY_FILE = os.path.join(DATA_DIR, "hierarchy.json")

_cache = None


def _load_ecc() -> dict:
    """Load ECC data from JSON file."""
    global _cache
    if _cache:
        return _cache

    # Try ECC_data.json first, then fall back to hierarchy.json
    if os.path.isfile(ECC_FILE):
        with open(ECC_FILE, "r", encoding="utf-8") as f:
            _cache = json.load(f)
        return _cache

    if os.path.isfile(HIERARCHY_FILE):
        with open(HIERARCHY_FILE, "r", encoding="utf-8") as f:
            _cache = json.load(f)
        return _cache

    return None


def is_hierarchy_loaded() -> bool:
    """Check if ECC data is available."""
    return os.path.isfile(ECC_FILE) or os.path.isfile(HIERARCHY_FILE)


def get_ecc_data():
    """Return the full ECC data structure."""
    return _load_ecc()


def get_hierarchy():
    """Backward compatible — returns structure the old endpoints expect."""
    data = _load_ecc()
    if not data:
        return None

    # New ECC_data.json format (multiple domains)
    if "domains" in data:
        # Flatten all domains into one hierarchy for backward compat
        all_sub_domains = []
        for domain in data["domains"]:
            for sd in domain.get("sub_domains", []):
                all_sub_domains.append(sd)

        return {
            "domain": {"domain_id": "ALL", "name": "NCA-ECC"},
            "sub_domains": all_sub_domains
        }

    # Old hierarchy.json format (single domain)
    return data


def save_hierarchy(data: dict):
    """Save uploaded hierarchy JSON to disk."""
    os.makedirs(DATA_DIR, exist_ok=True)

    # Detect format and save to appropriate file
    if "domains" in data:
        with open(ECC_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    else:
        with open(HIERARCHY_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    # Clear cache
    global _cache
    _cache = None


def get_all_deliverables():
    """Flatten all data to get all deliverables with their context."""
    data = _load_ecc()
    if not data:
        return []

    deliverables = []

    if "domains" in data:
        for domain in data["domains"]:
            for sd in domain.get("sub_domains", []):
                for ctrl in sd.get("controls", []):
                    for ed in ctrl.get("expected_deliverables", []):
                        deliverables.append({
                            "domain_id": domain["domain_id"],
                            "domain_name": domain["name"],
                            "sub_domain_id": sd["sub_domain_id"],
                            "sub_domain_name": sd["name"],
                            "control_id": ctrl["control_id"],
                            "control_name": ctrl["name"],
                            "deliverable_id": ed["deliverable_id"],
                            "deliverable_name": ed["name"]
                        })
    else:
        # Old format
        domain = data.get("domain", {})
        for sd in data.get("sub_domains", []):
            for ctrl in sd.get("controls", []):
                for sc in ctrl.get("sub_controls", []):
                    for ed in sc.get("expected_deliverables", []):
                        deliverables.append({
                            "domain_id": domain.get("domain_id", ""),
                            "domain_name": domain.get("name", ""),
                            "sub_domain_id": sd.get("sub_domain_id", ""),
                            "sub_domain_name": sd.get("name", ""),
                            "control_id": ctrl.get("control_id", ""),
                            "control_name": ctrl.get("name", ""),
                            "deliverable_id": ed["deliverable_id"],
                            "deliverable_name": ed["name"]
                        })

    return deliverables


def get_control_by_id(control_id: str):
    """Get control details by ID (works with new ECC format)."""
    data = _load_ecc()
    if not data:
        return None

    if "domains" in data:
        for domain in data["domains"]:
            for sd in domain.get("sub_domains", []):
                for ctrl in sd.get("controls", []):
                    if ctrl["control_id"] == control_id:
                        return {
                            "control": ctrl,
                            "sub_domain": sd,
                            "domain": domain
                        }
    return None


def get_sub_control_by_id(sub_control_id: str):
    """Backward compatible — also searches controls by ID."""
    data = _load_ecc()
    if not data:
        return None

    # Old format
    if "sub_domains" in data and "domain" in data:
        for sd in data["sub_domains"]:
            for ctrl in sd["controls"]:
                for sc in ctrl.get("sub_controls", []):
                    if sc["sub_control_id"] == sub_control_id:
                        return {
                            "sub_control": sc,
                            "control": ctrl,
                            "sub_domain": sd,
                            "domain": data["domain"]
                        }

    # New format — search controls and sub_controls
    if "domains" in data:
        for domain in data["domains"]:
            for sd in domain.get("sub_domains", []):
                for ctrl in sd.get("controls", []):
                    # Check sub_controls first
                    for sc in ctrl.get("sub_controls", []):
                        if sc.get("sub_control_id") == sub_control_id:
                            return {
                                "sub_control": {
                                    "sub_control_id": sc["sub_control_id"],
                                    "name": sc["name"],
                                    "expected_deliverables": sc.get("expected_deliverables", [])
                                },
                                "control": ctrl,
                                "sub_domain": sd,
                                "domain": domain
                            }

                    # Then check control_id
                    if ctrl["control_id"] == sub_control_id:
                        return {
                            "sub_control": {
                                "sub_control_id": ctrl["control_id"],
                                "name": ctrl["name"],
                                "expected_deliverables": ctrl.get("expected_deliverables", [])
                            },
                            "control": ctrl,
                            "sub_domain": sd,
                            "domain": domain
                        }

    return None
