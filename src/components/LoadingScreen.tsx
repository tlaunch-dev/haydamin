import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-background z-50"
    >
      {/* Animated cedar overlay - draws on top of global background */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <style>
            {`
              @keyframes drawPath {
                to {
                  stroke-dashoffset: 0;
                }
              }
              
              .cedar-path {
                stroke-dasharray: 1000;
                stroke-dashoffset: 1000;
                animation: drawPath 1.8s ease-out forwards;
              }
            `}
          </style>
          
          <g transform="translate(400, 50)" stroke="currentColor" className="text-accent" fill="none" strokeLinecap="round">
            {/* Main trunk */}
            <path d="M 0,0 Q -3,180 0,360 Q 2,500 0,650" strokeWidth="3.5" className="cedar-path" />
            
            {/* Top branches */}
            <path d="M 0,50 Q -45,38 -75,30" strokeWidth="1.5" className="cedar-path" />
            <path d="M 0,55 Q 38,43 65,35" strokeWidth="1.3" className="cedar-path" />
            <path d="M 0,62 Q -58,50 -95,42" strokeWidth="1.6" className="cedar-path" />
            <path d="M 0,68 Q 50,56 85,48" strokeWidth="1.4" className="cedar-path" />
            
            {/* Upper tier */}
            <path d="M 0,100 Q -75,88 -140,78" strokeWidth="1.8" className="cedar-path" />
            <path d="M 0,105 Q 70,93 128,83" strokeWidth="1.7" className="cedar-path" />
            <path d="M -140,78 Q -175,71 -205,66" strokeWidth="1.5" className="cedar-path" />
            <path d="M 128,83 Q 162,76 190,71" strokeWidth="1.4" className="cedar-path" />
            <path d="M 0,115 Q -100,103 -165,93" strokeWidth="1.6" className="cedar-path" />
            <path d="M 0,120 Q 88,108 150,98" strokeWidth="1.5" className="cedar-path" />
            <path d="M -165,93 Q -200,86 -230,81" strokeWidth="1.3" className="cedar-path" />
            
            {/* Middle-upper tier */}
            <path d="M 0,165 Q -108,153 -205,143" strokeWidth="1.9" className="cedar-path" />
            <path d="M 0,170 Q 105,158 198,148" strokeWidth="1.8" className="cedar-path" />
            <path d="M -205,143 Q -245,136 -285,131" strokeWidth="1.6" className="cedar-path" />
            <path d="M 198,148 Q 238,141 275,136" strokeWidth="1.5" className="cedar-path" />
            <path d="M 0,180 Q -130,168 -230,158" strokeWidth="1.7" className="cedar-path" />
            <path d="M 0,185 Q 122,173 220,163" strokeWidth="1.6" className="cedar-path" />
            <path d="M -230,158 Q -270,151 -310,146" strokeWidth="1.4" className="cedar-path" />
            <path d="M 220,163 Q 260,156 295,151" strokeWidth="1.3" className="cedar-path" />
            
            {/* Middle tier - widest spread */}
            <path d="M 0,240 Q -140,228 -270,218" strokeWidth="2" className="cedar-path" />
            <path d="M 0,245 Q 135,233 265,221" strokeWidth="1.9" className="cedar-path" />
            <path d="M -270,218 Q -320,211 -365,206" strokeWidth="1.7" className="cedar-path" />
            <path d="M 265,221 Q 315,214 358,209" strokeWidth="1.6" className="cedar-path" />
            <path d="M 0,255 Q -160,243 -295,233" strokeWidth="1.8" className="cedar-path" />
            <path d="M 0,260 Q 152,248 285,236" strokeWidth="1.7" className="cedar-path" />
            <path d="M -295,233 Q -345,226 -390,221" strokeWidth="1.5" className="cedar-path" />
            <path d="M 285,236 Q 335,229 375,224" strokeWidth="1.4" className="cedar-path" />
            
            {/* Lower-middle tier */}
            <path d="M 0,320 Q -148,308 -290,298" strokeWidth="2.1" className="cedar-path" />
            <path d="M 0,325 Q 143,313 280,301" strokeWidth="2" className="cedar-path" />
            <path d="M -290,298 Q -340,291 -385,286" strokeWidth="1.8" className="cedar-path" />
            <path d="M 280,301 Q 330,294 373,289" strokeWidth="1.7" className="cedar-path" />
            <path d="M 0,335 Q -168,323 -310,313" strokeWidth="1.9" className="cedar-path" />
            <path d="M 0,340 Q 160,328 300,316" strokeWidth="1.8" className="cedar-path" />
            
            {/* Lower tier */}
            <path d="M 0,400 Q -155,388 -305,378" strokeWidth="2.2" className="cedar-path" />
            <path d="M 0,405 Q 150,393 295,381" strokeWidth="2.1" className="cedar-path" />
            <path d="M -305,378 Q -355,371 -400,366" strokeWidth="1.9" className="cedar-path" />
            <path d="M 295,381 Q 345,374 388,369" strokeWidth="1.8" className="cedar-path" />
            <path d="M 0,415 Q -175,403 -320,393" strokeWidth="2" className="cedar-path" />
            <path d="M 0,420 Q 168,408 310,396" strokeWidth="1.9" className="cedar-path" />
            
            {/* Bottom tier */}
            <path d="M 0,480 Q -165,468 -320,458" strokeWidth="2.3" className="cedar-path" />
            <path d="M 0,485 Q 160,473 310,461" strokeWidth="2.2" className="cedar-path" />
            <path d="M -320,458 Q -370,451 -415,446" strokeWidth="2" className="cedar-path" />
            <path d="M 310,461 Q 360,454 403,449" strokeWidth="1.9" className="cedar-path" />
            
            {/* Secondary and tertiary branches for texture */}
            <path d="M -65,125 Q -100,120 -130,117" strokeWidth="1.2" opacity="0.7" className="cedar-path" />
            <path d="M 60,130 Q 95,125 125,122" strokeWidth="1.1" opacity="0.7" className="cedar-path" />
            <path d="M -90,195 Q -135,190 -170,187" strokeWidth="1.3" opacity="0.6" className="cedar-path" />
            <path d="M 85,200 Q 130,195 165,192" strokeWidth="1.2" opacity="0.6" className="cedar-path" />
            <path d="M -115,275 Q -160,270 -200,267" strokeWidth="1.4" opacity="0.7" className="cedar-path" />
            <path d="M 110,280 Q 155,275 195,272" strokeWidth="1.3" opacity="0.7" className="cedar-path" />
            <path d="M -135,355 Q -185,350 -225,347" strokeWidth="1.5" opacity="0.6" className="cedar-path" />
            <path d="M 130,360 Q 180,355 220,352" strokeWidth="1.4" opacity="0.6" className="cedar-path" />
            <path d="M -145,435 Q -195,430 -240,427" strokeWidth="1.6" opacity="0.7" className="cedar-path" />
            <path d="M 140,440 Q 190,435 235,432" strokeWidth="1.5" opacity="0.7" className="cedar-path" />
          </g>
        </svg>
      </div>
    </motion.div>
  );
}

