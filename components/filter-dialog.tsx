import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilterValues {
  liquidity: { min: string; max: string };
  fdv: { min: string; max: string };
  volume: { min: string; max: string };
  txn: { min: string; max: string };
  buy: { min: string; max: string };
  sell: { min: string; max: string };
  poolAge: { hour: string; unit: string };
}

interface FilterDialogProps {
  onApplyFilters: (filters: FilterValues) => void;
}

export function FilterDialog({ onApplyFilters }: FilterDialogProps) {
  const [filters, setFilters] = useState<FilterValues>({
    liquidity: { min: '', max: '' },
    fdv: { min: '', max: '' },
    volume: { min: '', max: '' },
    txn: { min: '', max: '' },
    buy: { min: '', max: '' },
    sell: { min: '', max: '' },
    poolAge: { hour: '', unit: '24h' }
  });

  const handleNumberInput = (value: string, key: keyof Omit<FilterValues, 'poolAge'>, field: 'min' | 'max') => {
    const numberPattern = /^\d*\.?\d*$/;
    if (value === '' || numberPattern.test(value)) {
      setFilters(prev => ({
        ...prev,
        [key]: { ...prev[key], [field]: value }
      }));
    }
  };

  const handlePoolAgeInput = (value: string) => {
    const numberPattern = /^\d*$/;
    if (value === '' || numberPattern.test(value)) {
      setFilters(prev => ({
        ...prev,
        poolAge: { ...prev.poolAge, hour: value }
      }));
    }
  };

  const handleReset = () => {
    setFilters({
      liquidity: { min: '', max: '' },
      fdv: { min: '', max: '' },
      volume: { min: '', max: '' },
      txn: { min: '', max: '' },
      buy: { min: '', max: '' },
      sell: { min: '', max: '' },
      poolAge: { hour: '', unit: '24h' }
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-purple-400 hover:bg-purple-400/20">
          Filter
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1b2e] border-purple-400/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Filter Options
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Liquidity Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>LIQUIDITY</Label>
              <div className="flex gap-2 items-center">
                <span className="text-sm">$</span>
                <Input
                  type="text"
                  placeholder="MIN"
                  value={filters.liquidity.min}
                  onChange={(e) => handleNumberInput(e.target.value, 'liquidity', 'min')}
                  className="bg-[#0D0D1F] border-purple-400/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2 items-center">
                <span className="text-sm">$</span>
                <Input
                  type="text"
                  placeholder="MAX"
                  value={filters.liquidity.max}
                  onChange={(e) => handleNumberInput(e.target.value, 'liquidity', 'max')}
                  className="bg-[#0D0D1F] border-purple-400/20"
                />
              </div>
            </div>
          </div>

          {/* FDV Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>FDV</Label>
              <div className="flex gap-2 items-center">
                <span className="text-sm">$</span>
                <Input
                  type="text"
                  placeholder="MIN"
                  value={filters.fdv.min}
                  onChange={(e) => handleNumberInput(e.target.value, 'fdv', 'min')}
                  className="bg-[#0D0D1F] border-purple-400/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2 items-center">
                <span className="text-sm">$</span>
                <Input
                  type="text"
                  placeholder="MAX"
                  value={filters.fdv.max}
                  onChange={(e) => handleNumberInput(e.target.value, 'fdv', 'max')}
                  className="bg-[#0D0D1F] border-purple-400/20"
                />
              </div>
            </div>
          </div>

          {/* Volume Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>VOLUME</Label>
              <div className="flex gap-2 items-center">
                <span className="text-sm">$</span>
                <Input
                  type="text"
                  placeholder="MIN"
                  value={filters.volume.min}
                  onChange={(e) => handleNumberInput(e.target.value, 'volume', 'min')}
                  className="bg-[#0D0D1F] border-purple-400/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2 items-center">
                <span className="text-sm">$</span>
                <Input
                  type="text"
                  placeholder="MAX"
                  value={filters.volume.max}
                  onChange={(e) => handleNumberInput(e.target.value, 'volume', 'max')}
                  className="bg-[#0D0D1F] border-purple-400/20"
                />
              </div>
            </div>
          </div>

          {/* TXN Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>TXN</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder="MIN"
                  value={filters.txn.min}
                  onChange={(e) => handleNumberInput(e.target.value, 'txn', 'min')}
                  className="bg-[#0D0D1F] border-purple-400/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder="MAX"
                  value={filters.txn.max}
                  onChange={(e) => handleNumberInput(e.target.value, 'txn', 'max')}
                  className="bg-[#0D0D1F] border-purple-400/20"
                />
              </div>
            </div>
          </div>

          {/* Buy Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>BUY</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder="MIN"
                  value={filters.buy.min}
                  onChange={(e) => handleNumberInput(e.target.value, 'buy', 'min')}
                  className="bg-[#0D0D1F] border-purple-400/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder="MAX"
                  value={filters.buy.max}
                  onChange={(e) => handleNumberInput(e.target.value, 'buy', 'max')}
                  className="bg-[#0D0D1F] border-purple-400/20"
                />
              </div>
            </div>
          </div>

          {/* Sell Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SELL</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder="MIN"
                  value={filters.sell.min}
                  onChange={(e) => handleNumberInput(e.target.value, 'sell', 'min')}
                  className="bg-[#0D0D1F] border-purple-400/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder="MAX"
                  value={filters.sell.max}
                  onChange={(e) => handleNumberInput(e.target.value, 'sell', 'max')}
                  className="bg-[#0D0D1F] border-purple-400/20"
                />
              </div>
            </div>
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>POOL AGE</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder="HOUR"
                  value={filters.poolAge.hour}
                  onChange={(e) => handlePoolAgeInput(e.target.value)}
                  className="bg-[#0D0D1F] border-purple-400/20"
                />
                <Select 
                  value={filters.poolAge.unit}
                  onValueChange={(value) => setFilters(prev => ({
                    ...prev,
                    poolAge: { ...prev.poolAge, unit: value }
                  }))}
                >
                  <SelectTrigger className="w-24 bg-[#0D0D1F] border-purple-400/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0D0D1F] border-purple-400/20">
                    <SelectItem value="1h">1H</SelectItem>
                    <SelectItem value="6h">6H</SelectItem>
                    <SelectItem value="24h">24H</SelectItem>
                    <SelectItem value="7d">7D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button 
            variant="outline" 
            className="border-red-400 hover:bg-red-400/20"
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button 
            className="bg-purple-500 hover:bg-purple-600"
            onClick={() => onApplyFilters(filters)}
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 