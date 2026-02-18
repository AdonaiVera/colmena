import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { triggerStyle, dropdownStyle, labelStyle, itemStyle } from "./dialog-styles";

interface BranchPickerProps {
  branches: string[];
  selectedBranch: string;
  onBranchChange: (branch: string) => void;
}

export function BranchPicker({ branches, selectedBranch, onBranchChange }: BranchPickerProps) {
  if (branches.length === 0) return null;

  return (
    <div style={{ padding: "0 28px 16px" }}>
      <Label style={labelStyle}>Branch</Label>
      <Select value={selectedBranch} onValueChange={onBranchChange}>
        <SelectTrigger style={triggerStyle}>
          <SelectValue placeholder="Create new branch" />
        </SelectTrigger>
        <SelectContent style={{ ...dropdownStyle, minWidth: 280 }}>
          <SelectItem value="__new__" style={itemStyle}>
            <span style={{ color: "var(--text)", fontSize: 13 }}>Create new branch</span>
          </SelectItem>
          {branches.map((b) => (
            <SelectItem key={b} value={b} style={itemStyle}>
              <span style={{ color: "var(--text)", fontSize: 13 }}>{b}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
