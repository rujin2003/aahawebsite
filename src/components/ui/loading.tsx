import { cn } from "@/lib/utils"

interface LoadingProps {
  className?: string
  color?: string
}

export function Loading({ className, color = "#8B7355" }: LoadingProps) {
  return (
    <div className={cn("lds-ellipsis", className)} style={{ color }}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  )
} 