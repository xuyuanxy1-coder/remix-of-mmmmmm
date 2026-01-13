interface MetaMaskLogoProps {
  className?: string;
  size?: number;
}

const MetaMaskLogo = ({ className = '', size = 24 }: MetaMaskLogoProps) => {
  return (
    <svg
      viewBox="0 0 318.6 318.6"
      width={size}
      height={size}
      className={className}
      fill="none"
    >
      <style>
        {`
          .gold-bright { fill: #F5D67B; }
          .gold-main { fill: #D4A853; }
          .gold-medium { fill: #C49A45; }
          .gold-dark { fill: #A67C30; }
          .gold-darker { fill: #8B6520; }
          .gold-shadow { fill: #6B4F18; }
        `}
      </style>
      {/* Main face - bright gold */}
      <polygon className="gold-bright" points="274.1,35.5 174.6,109.4 193,65.8" />
      <polygon className="gold-bright" points="44.4,35.5 143.1,110.1 125.6,65.8" />
      
      {/* Cheeks - main gold */}
      <polygon className="gold-main" points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7" />
      <polygon className="gold-main" points="33.9,207.7 50.1,263 106.8,247.4 80.3,206.8" />
      
      {/* Upper face sides */}
      <polygon className="gold-bright" points="103.6,138.2 87.8,162.1 143.8,164.6 141.8,104.5" />
      <polygon className="gold-bright" points="214.9,138.2 176.4,103.1 174.6,164.6 230.8,162.1" />
      
      {/* Chin connections */}
      <polygon className="gold-main" points="106.8,247.4 140.6,230.9 111.3,208.1" />
      <polygon className="gold-main" points="177.9,230.9 211.8,247.4 207.3,208.1" />
      
      {/* Chin bottom - medium gold */}
      <polygon className="gold-medium" points="211.8,247.4 177.9,230.9 180.6,253 180.3,262.3" />
      <polygon className="gold-medium" points="106.8,247.4 138.3,262.3 138.1,253 140.6,230.9" />
      
      {/* Eyes area - dark gold */}
      <polygon className="gold-dark" points="138.8,193.5 110.6,185.2 130.5,176.1" />
      <polygon className="gold-dark" points="179.7,193.5 188,176.1 208,185.2" />
      
      {/* Side panels - bright gold */}
      <polygon className="gold-bright" points="106.8,247.4 111.6,206.8 80.3,207.7" />
      <polygon className="gold-bright" points="207,206.8 211.8,247.4 238.3,207.7" />
      
      {/* Eye surroundings */}
      <polygon className="gold-bright" points="230.8,162.1 174.6,164.6 179.8,193.5 188.1,176.1 208.1,185.2" />
      <polygon className="gold-bright" points="110.6,185.2 130.6,176.1 138.8,193.5 143.8,164.6 87.8,162.1" />
      
      {/* Under eye shadows - main gold */}
      <polygon className="gold-main" points="87.8,162.1 111.3,208.1 110.6,185.2" />
      <polygon className="gold-main" points="208.1,185.2 207.3,208.1 230.8,162.1" />
      
      {/* Nose bridge */}
      <polygon className="gold-main" points="143.8,164.6 138.8,193.5 145.1,227.6 146.6,182.6" />
      <polygon className="gold-main" points="174.6,164.6 172,182.3 173.4,227.6 179.8,193.5" />
      
      {/* Lower face - darker gold */}
      <polygon className="gold-darker" points="179.8,193.5 173.4,227.6 177.9,230.9 207.3,208.1 208.1,185.2" />
      <polygon className="gold-darker" points="110.6,185.2 111.3,208.1 140.6,230.9 145.1,227.6 138.8,193.5" />
      
      {/* Bottom stripe - shadow */}
      <polygon className="gold-shadow" points="180.3,262.3 180.6,253 178.1,250.8 140.4,250.8 138.1,253 138.3,262.3 106.8,247.4 117.8,256.4 140.1,271.9 178.4,271.9 200.8,256.4 211.8,247.4" />
      
      {/* Nose - dark gold */}
      <polygon className="gold-dark" points="177.9,230.9 173.4,227.6 145.1,227.6 140.6,230.9 138.1,253 140.4,250.8 178.1,250.8 180.6,253" />
      
      {/* Ears - main gold with highlights */}
      <polygon className="gold-main" points="278.3,114.2 286.8,73.4 274.1,35.5 177.9,106.9 214.9,138.2 267.2,153.5 278.8,140 273.8,136.4 281.8,129.1 275.6,124.3 283.6,118.2" />
      <polygon className="gold-main" points="31.8,73.4 40.3,114.2 35,118.2 43,124.3 36.8,129.1 44.8,136.4 39.8,140 51.3,153.5 103.6,138.2 140.6,106.9 44.4,35.5" />
      
      {/* Outer face - bright gold */}
      <polygon className="gold-bright" points="267.2,153.5 214.9,138.2 230.8,162.1 207.3,208.1 238.3,207.7 284.8,207.7" />
      <polygon className="gold-bright" points="103.6,138.2 51.3,153.5 33.9,207.7 80.3,207.7 111.3,208.1 87.8,162.1" />
      
      {/* Center stripe - main gold */}
      <polygon className="gold-main" points="174.6,164.6 177.9,106.9 193.1,65.8 125.6,65.8 140.6,106.9 143.8,164.6 145,182.8 145.1,227.6 173.4,227.6 173.6,182.8" />
    </svg>
  );
};

export default MetaMaskLogo;
