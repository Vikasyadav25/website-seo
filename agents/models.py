"""Private normalized collector models; never serialize these directly to Pages."""
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Product(StrictModel):
    gid: str = Field(pattern=r"^gid://shopify/Product/\d+$")
    title: str
    product_type: str
    url: str | None
    seo_title: str | None
    seo_description: str | None
    updated_at: str


class SourceResult(StrictModel):
    name: Literal["gsc", "shopify", "pagespeed", "crawler", "merchant_manual"]
    status: Literal["connected", "not_configured", "failed", "stale"]
    records: list[dict] = Field(default_factory=list)
    complete: bool = True
    message: str = ""


class Change(StrictModel):
    field: Literal["seo.title", "seo.description"]
    before: str | None
    after: str | None


class PrivateProposal(StrictModel):
    id: str
    targetKind: Literal["product"] = "product"
    targetGid: str = Field(pattern=r"^gid://shopify/Product/\d+$")
    targetUrl: str
    fieldChanges: list[Change] = Field(min_length=1, max_length=2)
    baselineHash: str = Field(pattern=r"^[a-f0-9]{64}$")
    reason: str
    evidenceIds: list[str]
    impact: int = Field(ge=0, le=5)
    confidence: int = Field(ge=0, le=5)
    effort: int = Field(ge=1, le=5)
    risk: int = Field(ge=0, le=5)
    status: Literal["draft", "needs_review", "approved", "rejected", "applied", "failed", "rolled_back"]
    createdAt: str
