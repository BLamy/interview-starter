import { describe, it, expect } from 'vitest'
import { cn, add } from "../utils"

describe("add", () => {
  it("adds two positive numbers", () => {
    expect(add(2, 3)).toBe(5)
  })

  it("adds negative and positive number", () => {
    expect(add(-2, 3)).toBe(1)
  })

  it("adds two negative numbers", () => {
    expect(add(-2, -3)).toBe(-5)
  })

  it("adds zero", () => {
    expect(add(0, 5)).toBe(5)
    expect(add(5, 0)).toBe(5)
  })
})

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz")
  })

  it("removes duplicate tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
  })

  it("handles undefined and null", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar")
  })

  it("handles array of classes", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz")
  })
})

