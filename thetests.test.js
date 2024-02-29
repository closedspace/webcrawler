import { normalizeUrl } from "./main.mjs"

describe("normalizerURL behavior", () => {
  it("transforms unworthy urls to worthy ones", () => {
    const genericUrl = "http://example.com/"
    const expectedGenericUrl = "https://example.com"
    expect(normalizeUrl(genericUrl)).toBe(expectedGenericUrl)
  })

  it("it does not affect worthy urls", () => {
    const genericUrlPart2 = "http://example.com"
    const expectedGenericUrlPart2 = "https://example.com"

    expect(normalizeUrl(genericUrlPart2)).toBe(expectedGenericUrlPart2)
  })
})
