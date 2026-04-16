"""
Aggregation & Scoring Engine for Burhan Compliance System

Scoring Rules:
- Deliverable Level: Binary only (0 or 1) — scored by LLM
- Sub-Control Level: Average of deliverable scores
- Control Level: Average of sub-control scores
- Sub-Domain Level: Average of control scores
- Domain Level: Average of sub-domain scores
"""

from typing import List, Dict, Optional
from datetime import datetime
from controls_data import get_hierarchy, get_all_deliverables


class AggregationEngine:
    """
    Aggregates compliance scores from deliverables up through the hierarchy.
    """

    def calculate_binary_score(self, scores: List[int]) -> float:
        """
        Used for: Evidence, Sub-Control levels
        Rules:
            All 1 → 1
            All 0 → 0
            Mixed → 0.5
        Input scores are always 0 or 1 (from deliverable level)
        """
        if not scores:
            return 0.0

        unique_scores = set(scores)

        if unique_scores == {1}:
            return 1.0
        elif unique_scores == {0}:
            return 0.0
        else:
            return 0.5

    def calculate_average_score(self, scores: List[float]) -> float:
        """
        Used for: Control, Sub-Domain, Domain levels
        Simple average of child scores
        """
        if not scores:
            return 0.0

        return sum(scores) / len(scores)

    def get_status(self, score: float) -> str:
        """
        Convert score to status string
        1   → 'Compliant'
        0   → 'Non-Compliant'
        else → 'Partially Compliant'
        """
        if score == 1.0:
            return "Compliant"
        elif score == 0.0:
            return "Non-Compliant"
        else:
            return "Partially Compliant"

    def aggregate_sub_control(
        self,
        sub_control_id: str,
        sub_control_name: str,
        deliverable_results: List[Dict]
    ) -> Dict:
        """
        Aggregates all deliverable scores under a sub-control.
        Uses average of deliverable scores for percentage-based reporting.

        Args:
            sub_control_id: ID of the sub-control
            sub_control_name: Name of the sub-control
            deliverable_results: List of deliverable results with 'score' key

        Returns:
            SubControlResult as dict
        """
        scores = [d["score"] for d in deliverable_results]
        score = self.calculate_average_score(scores)
        status = self.get_status(score)

        return {
            "sub_control_id": sub_control_id,
            "name": sub_control_name,
            "score": score,
            "status": status,
            "deliverable_results": deliverable_results
        }

    def aggregate_control(
        self,
        control_id: str,
        control_name: str,
        sub_control_results: List[Dict]
    ) -> Dict:
        """
        Aggregates all sub-control scores under a control.
        Uses average of sub-control scores.

        Args:
            control_id: ID of the control
            control_name: Name of the control
            sub_control_results: List of sub-control results

        Returns:
            ControlResult as dict
        """
        scores = [sc["score"] for sc in sub_control_results]
        score = self.calculate_average_score(scores)
        status = self.get_status(score)

        return {
            "control_id": control_id,
            "name": control_name,
            "score": round(score, 2),
            "status": status,
            "sub_control_results": sub_control_results
        }

    def aggregate_sub_domain(
        self,
        sub_domain_id: str,
        sub_domain_name: str,
        control_results: List[Dict]
    ) -> Dict:
        """
        Aggregates all control scores under a sub-domain.
        Uses average of control scores.

        Args:
            sub_domain_id: ID of the sub-domain
            sub_domain_name: Name of the sub-domain
            control_results: List of control results

        Returns:
            SubDomainResult as dict
        """
        scores = [c["score"] for c in control_results]
        score = self.calculate_average_score(scores)
        status = self.get_status(score)

        return {
            "sub_domain_id": sub_domain_id,
            "name": sub_domain_name,
            "score": round(score, 2),
            "status": status,
            "control_results": control_results
        }

    def aggregate_domain(
        self,
        domain_id: str,
        domain_name: str,
        sub_domain_results: List[Dict]
    ) -> Dict:
        """
        Aggregates all sub-domain scores under a domain.
        Uses average of sub-domain scores.

        Args:
            domain_id: ID of the domain
            domain_name: Name of the domain
            sub_domain_results: List of sub-domain results

        Returns:
            DomainResult as dict
        """
        scores = [sd["score"] for sd in sub_domain_results]
        score = self.calculate_average_score(scores)
        status = self.get_status(score)

        return {
            "domain_id": domain_id,
            "name": domain_name,
            "score": round(score, 2),
            "status": status,
            "sub_domain_results": sub_domain_results
        }

    def generate_full_report(
        self,
        deliverable_results: Dict[str, Dict]
    ) -> Dict:
        """
        Main aggregation function.
        Takes all LLM deliverable results and aggregates up through every level.

        Args:
            deliverable_results: Dict mapping deliverable_id to result
                Example: {
                    "2-1-1-ED1": {"score": 1, "explanation": "..."},
                    "2-1-1-ED2": {"score": 0, "explanation": "..."},
                    ...
                }

        Returns:
            FullComplianceReport as dict
        """
        hierarchy = get_hierarchy()
        domain = hierarchy["domain"]

        sub_domain_results = []

        for sub_domain in hierarchy["sub_domains"]:
            control_results = []

            for control in sub_domain["controls"]:
                sub_control_results = []

                sub_controls = control.get("sub_controls", [])
                if not sub_controls:
                    # Control has deliverables directly — treat as a virtual sub-control
                    sc_deliverable_results = []
                    for deliverable in control.get("expected_deliverables", []):
                        d_id = deliverable["deliverable_id"]
                        if d_id in deliverable_results:
                            result = deliverable_results[d_id]
                            sc_deliverable_results.append({
                                "deliverable_id": d_id,
                                "name": deliverable["name"],
                                "score": result["score"],
                                "status": self.get_status(result["score"]),
                                "explanation": result.get("explanation", "")
                            })
                        else:
                            sc_deliverable_results.append({
                                "deliverable_id": d_id,
                                "name": deliverable["name"],
                                "score": 0,
                                "status": "Non-Compliant",
                                "explanation": "No evidence provided"
                            })
                    sc_result = self.aggregate_sub_control(
                        control["control_id"],
                        control["name"],
                        sc_deliverable_results
                    )
                    sub_control_results.append(sc_result)
                else:
                    for sub_control in sub_controls:
                        # Collect deliverable results for this sub-control
                        sc_deliverable_results = []

                        for deliverable in sub_control["expected_deliverables"]:
                            d_id = deliverable["deliverable_id"]

                            if d_id in deliverable_results:
                                result = deliverable_results[d_id]
                                sc_deliverable_results.append({
                                    "deliverable_id": d_id,
                                    "name": deliverable["name"],
                                    "score": result["score"],
                                    "status": self.get_status(result["score"]),
                                    "explanation": result.get("explanation", "")
                                })
                            else:
                                # No result for this deliverable - mark as non-compliant
                                sc_deliverable_results.append({
                                    "deliverable_id": d_id,
                                    "name": deliverable["name"],
                                    "score": 0,
                                    "status": "Non-Compliant",
                                    "explanation": "No evidence provided"
                                })

                        # Aggregate sub-control
                        sc_result = self.aggregate_sub_control(
                            sub_control["sub_control_id"],
                            sub_control["name"],
                            sc_deliverable_results
                        )
                        sub_control_results.append(sc_result)

                # Aggregate control
                ctrl_result = self.aggregate_control(
                    control["control_id"],
                    control["name"],
                    sub_control_results
                )
                control_results.append(ctrl_result)

            # Aggregate sub-domain
            sd_result = self.aggregate_sub_domain(
                sub_domain["sub_domain_id"],
                sub_domain["name"],
                control_results
            )
            sub_domain_results.append(sd_result)

        # Aggregate domain
        domain_result = self.aggregate_domain(
            domain["domain_id"],
            domain["name"],
            sub_domain_results
        )

        # Build full report
        return {
            "generated_at": datetime.now().isoformat(),
            "domain_result": domain_result,
            "overall_score": domain_result["score"],
            "overall_status": domain_result["status"]
        }

    def print_report(self, report: Dict) -> str:
        """
        Generate a formatted string representation of the report.

        Args:
            report: The full compliance report

        Returns:
            Formatted string for CLI output
        """
        lines = []
        lines.append("")
        lines.append("=" * 60)
        lines.append("   BURHAN - Full Compliance Report")
        lines.append("=" * 60)
        lines.append("")

        domain = report["domain_result"]
        lines.append(f"Domain: {domain['name']}")
        lines.append(f"   Score: {domain['score']} | {domain['status']}")
        lines.append("")

        for sub_domain in domain["sub_domain_results"]:
            lines.append(f"  Sub-Domain: {sub_domain['name']}")
            lines.append(f"     Score: {sub_domain['score']} | {sub_domain['status']}")
            lines.append("")

            for control in sub_domain["control_results"]:
                lines.append(f"    Control: {control['control_id']} - {control['name']}")
                lines.append(f"       Score: {control['score']} | {control['status']}")
                lines.append("")

                for sub_control in control["sub_control_results"]:
                    lines.append(f"      Sub-Control: {sub_control['sub_control_id']} - {sub_control['name']}")
                    lines.append(f"         Score: {sub_control['score']} | {sub_control['status']}")
                    lines.append("")

                    for deliverable in sub_control["deliverable_results"]:
                        icon = "+" if deliverable["score"] == 1 else "-"
                        lines.append(f"          [{icon}] {deliverable['deliverable_id']}: {deliverable['name'][:50]}...")
                        lines.append(f"              Score: {deliverable['score']} | {deliverable['status']}")

                    lines.append("")

        lines.append("=" * 60)
        lines.append(f"  Overall Score: {report['overall_score']} | {report['overall_status']}")
        lines.append("=" * 60)
        lines.append("")

        return "\n".join(lines)
