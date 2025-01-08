#![deny(clippy::all)]

use std::path::Path;

use gaoya::{
    minhash::{MinHasher, MinHasher32},
    text::whitespace_split,
};
use napi::{Error, Result};

#[macro_use]
extern crate napi_derive;

#[napi]
pub fn minhash_path(path: String) -> Result<Vec<u32>> {
    let file =
        std::fs::read_to_string(Path::new(&path)).map_err(|e| Error::from_reason(e.to_string()))?;

    Ok(minhash_text(file))
}

#[napi]
pub fn minhash_text(text: String) -> Vec<u32> {
    let num_bands = 42;
    let band_width = 3;
    let hasher = MinHasher32::new(num_bands * band_width);

    let text = text.to_lowercase();
    let hash = hasher.create_signature(whitespace_split(&text));

    hash
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_minhash_same_text() {
        // Same text should produce same hash
        let text1 = "hello world".to_string();
        let text2 = "hello world".to_string();
        assert_eq!(minhash_text(text1), minhash_text(text2));
    }

    #[test]
    fn test_minhash_different_text() {
        // Different text should produce different hash
        let text1 = "hello world".to_string();
        let text2 = "hello there".to_string();

        let value1 = minhash_text(text1);
        let value2 = minhash_text(text2);

        assert_ne!(value1, value2);

        let similarity = value1
            .iter()
            .zip(value2.iter())
            .filter(|&(a, b)| a == b)
            .count() as f32;
        assert!(similarity > 0.9);
    }

    #[test]
    fn test_minhash_case_insensitive() {
        // Case insensitive comparison
        let text1 = "hello world".to_string();
        let text2 = "HELLO WORLD".to_string();
        assert_eq!(minhash_text(text1), minhash_text(text2));
    }

    #[test]
    fn test_minhash_whitespace() {
        // Extra whitespace should not affect the hash
        let text1 = "hello    world".to_string();
        let text2 = "hello world".to_string();
        assert_eq!(minhash_text(text1), minhash_text(text2));
    }

    #[test]
    fn test_minhash_empty_string() {
        // Empty string should produce expected output
        let empty = String::new();
        let result = minhash_text(empty);
        assert_eq!(result.len(), 126); // 42 bands * 3 width = 126
        assert!(result.iter().all(|&x| x == 0)); // Empty string should produce all zeros
    }
}
