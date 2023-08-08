export const getEquilibrium = (
  amount_: number,
  weight_: number,
  totalWeight_: number,
) => {
  return Math.floor((amount_ * weight_) / totalWeight_);
};

export const getThreshold = (
  equilibrium_: number,
  amplifier_: number,
) => {
  return Math.floor(equilibrium_ * amplifier_ / 1000000);
};

export const getTokenFee = (
  equilibrium_: number,
  deviation_: number,
  slipRate_: number,
) => {
  const slippage = Math.floor(deviation_ * slipRate_ / 1000000);
  const feeRate = Math.floor(slippage / equilibrium_ * 1000000);
  return Math.floor(deviation_ * feeRate / 1000000);
};