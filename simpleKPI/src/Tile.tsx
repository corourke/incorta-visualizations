import React from 'react';

interface TileProps {
  dim: string;
  measure1: string;
  measure2: string;
  iconURL: string;
}

export const Tile: React.FC<TileProps> = ({
  dim: coinId,
  measure1: aggPosition,
  measure2: price,
  iconURL
}) => {
  // TODO: Make the overall tile narrower and or responsive
  const renderCoinData = () => {
    // TODO: Need to allow for different currencies and locales
    const iso_4217_code = 'USD';
    return Response ? (
      <>
        <div className="coinName">{coinId}</div>
        <div className="percentChange">{price}%</div>
        <img className="icon" src={iconURL} />
        {/* <div className="tradingPair">
          {response.data.symbol.toUpperCase()}
          <span className="lighter">/{iso_4217_code}</span>
        </div> */}
        <div className="price">
          {price}
          <span className="currency">{iso_4217_code}</span>
        </div>
        <div className="priceChange">{aggPosition}</div>
        <div className="value">Mkt Value: {price}</div>
      </>
    ) : (
      ''
    );
  };

  return <div className="boundingBox">{renderCoinData()}</div>;
};
