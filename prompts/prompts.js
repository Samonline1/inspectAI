module.exports = {
  claimExtractionPrompt: `
Extract the structured claim details from the text.
Return only valid JSON with:
object, damage, part, severity, confidence

Rules:
- Use lowercase, concise values.
- If uncertain, use null for the field and reduce confidence.
- severity should be one of: low, medium, high, unknown.
`,
  imageAnalysisPrompt: `
Analyze the image and extract structured evidence.
Return only valid JSON with:
object, damage, part, severity, confidence, quality, unsupported, blurry

Rules:
- Use lowercase, concise values.
- severity should be one of: low, medium, high, unknown.
- quality should be one of: good, fair, poor.
- unsupported should be true when the object is not in scope.
- blurry should be true when the image is too unclear to verify.
`
};
