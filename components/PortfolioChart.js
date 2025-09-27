import React from 'react'
import { Pie } from 'react-chartjs-2'
import { PieChart, Target, RotateCcw } from 'lucide-react'

const PortfolioChart = ({ 
  totalAllocation, 
  chartData, 
  chartOptions, 
  generateQRCode, 
  resetSelection, 
  selectedChains 
}) => {
  return (
    <div className="glass-card p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
          <PieChart className="w-3 h-3 text-white/70" />
        </div>
        <h3 className="text-lg font-bold text-white/90">Portfolio Allocation</h3>
      </div>
      
      <div className="flex-1 mb-4 flex items-center justify-center">
        {totalAllocation > 0 ? (
          <Pie data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-white/30 rounded-xl bg-white/5 p-8">
            <div className="text-center text-white/60 max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
                <PieChart className="w-10 h-10 text-white/40" />
              </div>
              <h3 className="text-lg font-semibold text-white/80 mb-3">Select tokens to see your portfolio</h3>
              <p className="text-sm text-white/50 leading-relaxed">Choose from available tokens on the right to build your custom portfolio allocation</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col gap-3 mt-auto">
        <button
          onClick={generateQRCode}
          disabled={Object.keys(selectedChains).length === 0}
          className="w-full px-6 py-3 bg-white/20 border border-white/30 text-white rounded-xl hover:bg-white/30 disabled:bg-white/5 disabled:border-white/10 disabled:text-white/40 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center space-x-2 backdrop-blur-sm"
        >
          <Target className="w-4 h-4" />
          <span>Generate QR</span>
        </button>
        <button
          onClick={resetSelection}
          className="w-full px-6 py-3 bg-white/10 border border-white/20 text-white/80 rounded-xl hover:bg-white/20 hover:text-white transition-all duration-200 font-medium backdrop-blur-sm flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  )
}

export default PortfolioChart
