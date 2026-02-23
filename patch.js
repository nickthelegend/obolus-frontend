const fs = require('fs');
const file = '/Users/jaibajrang/Desktop/Projects/stark/obolus-frontend/components/perp/PerpTerminal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add toast check
const replace = `
            const collateralAmount = parseFloat(size) * currentPrice / leverage;
            const collateralBaseUnits = BigInt(Math.floor(collateralAmount * 1e6)); // 6 decimals for USDT

            if (collateralAmount > houseBalance) {
                alert(\`Insufficient USDT. Required: \${collateralAmount.toFixed(2)} USDT, Available: \${houseBalance.toFixed(2)} USDT\`);
                setIsPlacing(false);
                return;
            }
`;

content = content.replace(
    /const collateralAmount = parseFloat\(size\) \* currentPrice \/ leverage;\s+const collateralBaseUnits = BigInt\(Math.floor\(collateralAmount \* 1e6\)\); \/\/ 6 decimals for USDT/,
    replace.trim()
);

fs.writeFileSync(file, content);
