import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ScrollLoader from "@/components/ScrollLoader";
import type { Product } from "@shared/schema";

interface OptimizedProductSearchProps {
  searchQuery?: string;
  category?: string;
  isRestaurantMode?: boolean;
}

export default function OptimizedProductSearch({ 
  searchQuery = "", 
  category = "",
  isRestaurantMode = false
}: OptimizedProductSearchProps) {
  const [visibleCount, setVisibleCount] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const initialLoad = 6;
  const loadMoreCount = 4;

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { search: searchQuery, category, limit: 30 }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery?.trim()) params.append('search', searchQuery.trim());
      if (category?.trim()) params.append('category', category.trim());
      params.append('limit', '30'); // Limit for performance
      
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
    retry: 1
  });

  const visibleProducts = useMemo(() => {
    return products.slice(0, visibleCount);
  }, [products, visibleCount]);

  const loadMore = useCallback(() => {
    if (visibleCount >= products.length) return;
    
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + loadMoreCount, products.length));
      setIsLoadingMore(false);
    }, 300);
  }, [visibleCount, products.length, loadMoreCount]);

  useEffect(() => {
    const handleScroll = () => {
      if (isLoadingMore || visibleCount >= products.length) return;
      
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      
      if (scrollTop + windowHeight >= docHeight - 200) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, isLoadingMore, visibleCount, products.length]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-32 rounded-lg mb-2"></div>
            <div className="bg-gray-200 h-4 rounded mb-1"></div>
            <div className="bg-gray-200 h-3 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <ScrollLoader isLoading={isLoadingMore} />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      
      {isLoadingMore && (
        <div className="text-center mt-6">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </div>
      )}
      
      {visibleCount < products.length && !isLoadingMore && (
        <div className="text-center mt-6 text-sm text-muted-foreground">
          Scroll down to load more ({products.length - visibleCount} remaining)
        </div>
      )}
      
      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found</p>
        </div>
      )}
    </>
  );
}