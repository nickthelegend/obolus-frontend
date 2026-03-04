/**
 * Starknet address normalization utilities
 */

/**
 * Normalizes a Starknet address to a standard format:
 * - 0x prefix
 * - lowercase
 * - no leading zeros in the hex part (standard for Starknet.js)
 * @param address - Starknet address hex string
 * @returns Normalized address string or original if invalid
 */
export function normalizeAddress(address: string | null | undefined): string {
    if (!address) return '';

    try {
        // Ensure 0x prefix
        let normalized = address.toLowerCase();
        if (!normalized.startsWith('0x')) {
            normalized = '0x' + normalized;
        }

        // Remove leading zeros after 0x for canonical representation
        // Example: 0x064b... -> 0x64b...
        const hexPart = normalized.slice(2).replace(/^0+/, '');
        return '0x' + (hexPart || '0');
    } catch (e) {
        console.error('Address normalization failed:', e);
        return address || '';
    }
}
