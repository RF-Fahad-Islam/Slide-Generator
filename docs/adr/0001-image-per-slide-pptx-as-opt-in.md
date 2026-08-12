# Exact-image PPTX export is an opt-in mode alongside the editable default

The editable-hybrid PPTX (native Bangla text boxes, D3) remains the default export, but
the plan's §9.1 fallback — rendering each slide as a full-bleed rasterized image so the
PPTX is pixel-identical to the live preview — is now shipped as an opt-in "Exact slide
images" checkbox in the export modal. The raster pipeline already existed (PNG/PDF
export), so the mode is one flag in the exporter (`slideImageDataUrls`); speaker notes
are still attached so structured content stays extractable. Approved in a grilling
session 2026-08-12: additive only, never the default, because image mode sacrifices D3
editability (viewer cannot edit Bangla text). Rejected alternative: making image mode the
default, which would silently drop the product's #1 priority.
