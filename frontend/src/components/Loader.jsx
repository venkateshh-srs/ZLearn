import React from "react";

const Loader = ({ size = 16, className = "" }) => {
  return (
    <>
      <div
        className={`loader ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
      />
      <style>{`
        .loader {
          aspect-ratio: 1;
          --c: no-repeat linear-gradient(#fff 0 0);
          background: 
            var(--c) 0%   50%,
            var(--c) 50%  50%,
            var(--c) 100% 50%;
          background-size: 20% 100%;
          animation: l1 1s infinite linear;
        }

        @keyframes l1 {
          0%   { background-size: 20% 100%, 20% 100%, 20% 100% }
          33%  { background-size: 20% 10% , 20% 100%, 20% 100% }
          50%  { background-size: 20% 100%, 20% 10% , 20% 100% }
          66%  { background-size: 20% 100%, 20% 100%, 20% 10%  }
          100% { background-size: 20% 100%, 20% 100%, 20% 100% }
        }
      `}</style>
    </>
  );
};

export default Loader;
