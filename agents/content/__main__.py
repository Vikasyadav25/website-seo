"""Validate and package an assisted content run. Does not generate or publish content."""
import argparse
import json
import shutil
from pathlib import Path

from agents.main import build_report
from agents.security.public_allowlist import ROOT, validate_public_report


def package_content(input_path: Path, output_path: Path):
    output_path = output_path.resolve()
    if not output_path.is_relative_to((ROOT / "private").resolve()):
        raise ValueError("Content output must stay private")
    workflow = json.loads(input_path.read_text(encoding="utf-8"))
    validate_public_report({**build_report("production"), "contentWorkflow": workflow})
    assets = []
    for image in workflow["images"]:
        path = (ROOT / "web/public" / image["src"]).resolve()
        if not path.is_relative_to((ROOT / "web/public/content").resolve()) or not path.is_file():
            raise ValueError("Reviewed image missing or unsafe")
        assets.append(path)
    output_path.mkdir(parents=True, exist_ok=True)
    article = ["DRAFT - Human review required. Not published.", "# " + workflow["draft"]["title"]]
    article.extend("## " + section["heading"] + "\n\n" + section["text"] for section in workflow["draft"]["sections"])
    article.append("## Frequently asked questions")
    article.extend("### " + faq["question"] + "\n\n" + faq["answer"] for faq in workflow["draft"]["faqs"])
    article.append("## Sources")
    article.extend("- " + source["label"] + ": " + source["url"] for source in workflow["sources"])
    (output_path / "article.md").write_text("\n\n".join(article) + "\n", encoding="utf-8")
    (output_path / "manifest.json").write_text(json.dumps(workflow, indent=2) + "\n", encoding="utf-8")
    (output_path / "brief.md").write_text("# Editorial keyword ideas\n\n" + "\n".join("- " + keyword for keyword in workflow["keywords"])
                                           + "\n\nNo volume, difficulty or ranking data was collected.\n", encoding="utf-8")
    for asset in assets:
        shutil.copy2(asset, output_path / asset.name)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=ROOT / "agents/content/silver-care-review.json")
    parser.add_argument("--output", type=Path, default=ROOT / "private/content/925-silver-care")
    args = parser.parse_args()
    try:
        package_content(args.input, args.output)
    except (ValueError, OSError):
        parser.exit(1, "Content bundle refused: check safe input, assets and output path.\n")
    print("Assisted draft bundle validated and saved locally. No store publication performed.")


if __name__ == "__main__":
    main()
