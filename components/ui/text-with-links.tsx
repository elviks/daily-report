"use client"

import React from "react"

// URL regex pattern to detect various types of links including those with @ prefix
// More specific pattern to avoid false positives like "done." or "word."
const urlRegex = /(@?https?:\/\/[^\s]+|@?www\.[^\s]+|@?[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?(?:\/[^\s]*)?)/gi

// Function to validate if a string is actually a URL
function isValidUrl(str: string): boolean {
  // Remove @ prefix for validation
  const cleanStr = str.replace(/^@/, '')
  
  // Must have a domain with at least 2 characters TLD
  const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?/
  
  // Check if it starts with http/https/www or has a valid domain
  return cleanStr.startsWith('http://') || 
         cleanStr.startsWith('https://') || 
         cleanStr.startsWith('www.') ||
         domainPattern.test(cleanStr)
}

interface TextWithLinksProps {
  text: string
  className?: string
}

export function TextWithLinks({ text, className = "" }: TextWithLinksProps) {
  if (!text) return null

  // Create a new regex instance for splitting to avoid state issues
  const splitRegex = /(@?https?:\/\/[^\s]+|@?www\.[^\s]+|@?[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?(?:\/[^\s]*)?)/gi
  const parts = text.split(splitRegex)
  const result: (string | JSX.Element)[] = []

  parts.forEach((part, index) => {
    if (!part) return

    // Check if this part is actually a valid URL
    if (isValidUrl(part)) {
      // Remove @ prefix if present and ensure the URL has a protocol
      let url = part.replace(/^@/, '')
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }

      result.push(
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          {part}
        </a>
      )
    } else {
      result.push(part)
    }
  })

  return <div className={`whitespace-pre-wrap ${className}`}>{result}</div>
}
