"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, Button } from "@/components/ui/button"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size,
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      "h-10 w-10 p-0 text-sm",
      "transition-colors duration-200 ease-in-out",
      "flex items-center justify-center rounded-full",
      isActive
        ? "bg-primary text-primary-foreground font-bold shadow-md"
        : "hover:bg-muted",
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof Button>) => (
  <Button
    aria-label="Ir a la página anterior"
    size="icon"
    variant="ghost"
    className={cn("h-12 w-12 rounded-full", className)}
    {...props}
  >
    <ChevronsLeft className="h-6 w-6" />
    <span className="sr-only">Anterior</span>
  </Button>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof Button>) => (
  <Button
    aria-label="Ir a la página siguiente"
    size="icon"
    variant="ghost"
    className={cn("h-12 w-12 rounded-full", className)}
    {...props}
  >
    <ChevronsRight className="h-6 w-6" />
    <span className="sr-only">Siguiente</span>
  </Button>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">Más páginas</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"


interface SmartPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const SmartPagination: React.FC<SmartPaginationProps> = ({ currentPage, totalPages, onPageChange, className }) => {
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const ellipsis = '...';

    if (totalPages <= maxPagesToShow + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      if (currentPage > 3) {
        pageNumbers.push(ellipsis);
      }
      
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (currentPage < totalPages - 2) {
        pageNumbers.push(ellipsis);
      }
      pageNumbers.push(totalPages);
    }
    return pageNumbers;
  };
  
  if (totalPages <= 1) {
    return null;
  }

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={(e) => { e.preventDefault(); onPageChange(currentPage - 1); }}
            disabled={currentPage === 1}
          />
        </PaginationItem>
        
        <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  <PaginationItem key={`num-${index}`}>
                    {typeof page === 'number' ? (
                      <PaginationLink
                        href="#"
                        onClick={(e) => { e.preventDefault(); onPageChange(page); }}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    ) : (
                      <PaginationEllipsis />
                    )}
                  </PaginationItem>
                ))}
            </div>
             <div className="mt-2 flex items-center justify-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, index) => (
                    <div 
                        key={`dot-${index}`}
                        className={cn(
                            "h-1.5 w-1.5 rounded-full transition-all duration-300",
                            currentPage === index + 1 ? 'w-4 bg-primary' : 'bg-muted-foreground/30'
                        )}
                    />
                ))}
            </div>
        </div>

        <PaginationItem>
          <PaginationNext
            onClick={(e) => { e.preventDefault(); onPageChange(currentPage + 1); }}
            disabled={currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};


export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
