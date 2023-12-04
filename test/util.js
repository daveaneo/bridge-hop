function Enum(...options) {
    return Object.fromEntries(options.map((key, i) => [key, i]));
}

const TransmissionType = Enum("SwapData", "LiquidityStaging", "Liquidity");

module.exports = { TransmissionType };
