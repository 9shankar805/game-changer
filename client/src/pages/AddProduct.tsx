import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AIImageUpload from "@/components/AIImageUpload";

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  brand: z.string().min(1, "Brand is required"),
  categoryId: z.number().min(1, "Category is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  originalPrice: z.string().optional(),
  stock: z.number().min(0, "Stock cannot be negative"),
  images: z.array(z.string()).default([]),
  productType: z.enum(["retail", "food"]).default("retail"),
  features: z.array(z.string()).default([]),
  // Food-specific fields
  preparationTime: z.string().optional(),
  ingredients: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  spiceLevel: z.string().optional(),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  nutritionInfo: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Store {
  id: number;
  name: string;
  storeType: string;
}

// Helper function to detect restaurant by name
const isRestaurantByName = (storeName: string): boolean => {
  const restaurantKeywords = [
    'restaurant', 'cafe', 'food', 'kitchen', 'dining', 'eatery', 'bistro',
    'pizzeria', 'burger', 'pizza', 'chicken', 'biryani', 'dosa', 'samosa',
    'chinese', 'indian', 'nepali', 'thai', 'continental', 'fast food',
    'dhaba', 'hotel', 'canteen', 'mess', 'tiffin', 'sweet', 'bakery',
    'family restaurant' // Specific detection for user's store
  ];
  
  const lowerName = storeName.toLowerCase();
  return restaurantKeywords.some(keyword => lowerName.includes(keyword));
};

export default function AddProduct() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [newAllergen, setNewAllergen] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  // Categories query
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Store query to get current store info
  const { data: stores = [], isLoading: storesLoading, error: storesError } = useQuery<Store[]>({
    queryKey: [`/api/stores/owner/${user?.id}`],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/stores/owner/${user.id}`);
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error('Failed to fetch stores');
      }
      return response.json();
    },
    enabled: !!user,
  });

  const currentStore = stores[0]; // Assuming one store per shopkeeper
  
  // Enhanced restaurant detection - check both storeType and name
  const isRestaurant = currentStore?.storeType === 'restaurant' || 
    (currentStore?.name && currentStore.name.toLowerCase().includes('restaurant'));
  
  const defaultProductType = isRestaurant ? 'food' : 'retail';

  // Get the first available category ID as default
  const defaultCategoryId = categories.length > 0 ? categories[0].id : 1;

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      brand: "",
      categoryId: defaultCategoryId,
      description: "",
      price: "",
      originalPrice: "",
      stock: 0,
      images: [],
      productType: defaultProductType,
      features: [],
      preparationTime: "",
      ingredients: [],
      allergens: [],
      spiceLevel: "",
      isVegetarian: false,
      isVegan: false,
      nutritionInfo: "",
    },
  });

  // Update default category when categories load
  useEffect(() => {
    if (categories.length > 0 && defaultCategoryId !== 1) {
      form.setValue("categoryId", categories[0].id);
    }
  }, [categories, defaultCategoryId, form]);

  const watchProductType = form.watch("productType");

  const handleAddIngredient = () => {
    if (newIngredient.trim() && !ingredients.includes(newIngredient.trim())) {
      const updated = [...ingredients, newIngredient.trim()];
      setIngredients(updated);
      form.setValue("ingredients", updated);
      setNewIngredient("");
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    const updated = ingredients.filter(i => i !== ingredient);
    setIngredients(updated);
    form.setValue("ingredients", updated);
  };

  const handleAddAllergen = () => {
    if (newAllergen.trim() && !allergens.includes(newAllergen.trim())) {
      const updated = [...allergens, newAllergen.trim()];
      setAllergens(updated);
      form.setValue("allergens", updated);
      setNewAllergen("");
    }
  };

  const handleRemoveAllergen = (allergen: string) => {
    const updated = allergens.filter(a => a !== allergen);
    setAllergens(updated);
    form.setValue("allergens", updated);
  };

  const handleAddFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      const updated = [...features, newFeature.trim()];
      setFeatures(updated);
      form.setValue("features", updated);
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (feature: string) => {
    const updated = features.filter(f => f !== feature);
    setFeatures(updated);
    form.setValue("features", updated);
  };

  const generateAIDescription = async () => {
    const formValues = form.getValues();
    const { name, brand } = formValues;
    const selectedCategory = categories.find(c => c.id === formValues.categoryId);
    
    if (!name || !brand || !selectedCategory) {
      toast({
        title: "Missing Information",
        description: "Please fill in product name, brand, and category first",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: name,
          brand: brand,
          category: selectedCategory.name,
          features: features
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate description');
      }

      const { description } = await response.json();
      form.setValue('description', description);
      
      toast({
        title: "Description Generated!",
        description: "AI has created a professional product description"
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Could not generate description. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const onSubmit = async (data: ProductForm) => {
    if (!currentStore) {
      toast({
        title: "Error",
        description: "Please create a store first",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const productData = {
        ...data,
        storeId: currentStore.id,
        ingredients,
        allergens,
        features,
        productType: isRestaurant ? 'food' : data.productType,
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      const successMessage = isRestaurant ? "Menu item added successfully!" : "Product added successfully!";
      toast({ title: successMessage });
      
      // Invalidate all relevant queries to refresh inventory data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/products/store/${currentStore.id}`] }),
        queryClient.invalidateQueries({ queryKey: ["/api/products"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/products/store", user?.id] }),
        queryClient.invalidateQueries({ queryKey: ["/api/seller/inventory", user?.id] }),
        queryClient.invalidateQueries({ queryKey: ["/api/seller/dashboard", user?.id] })
      ]);
      
      // Navigate back to inventory
      setLocation("/seller/inventory");
    } catch (error) {
      toast({
        title: "Error",
        description: isRestaurant ? "Failed to add menu item" : "Failed to add product",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'shopkeeper') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You need to be a shopkeeper to add products.
            </p>
            <div className="mt-4 text-center">
              <Link href="/" className="text-primary hover:underline">
                Go back to homepage
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentStore) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">No Store Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              You need to create a store before adding products.
            </p>
            <div className="flex justify-center">
              <Link href="/seller/store">
                <Button>Create Store</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <Link href="/seller/inventory">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isRestaurant ? 'Add New Menu Item' : 'Add New Product'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isRestaurant ? 'Add items to your restaurant menu' : 'Add products to your store inventory'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Product Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        {isRestaurant ? 'Menu Item Name *' : 'Product Name *'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={isRestaurant ? "Enter menu item name" : "Enter product name"} 
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Brand */}
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Brand *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter brand name" 
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Product Type (for mixed stores) */}
                {!isRestaurant && (
                  <FormField
                    control={form.control}
                    name="productType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Product Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select product type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="retail">Retail Product</SelectItem>
                            <SelectItem value="food">Food Item</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Category */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Category *</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.length > 0 ? (
                            categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="1" disabled>
                              Loading categories...
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Key Features */}
                <div className="space-y-4">
                  <FormLabel className="text-base font-medium">Key Features</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a key feature"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      className="h-11 flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleAddFeature}
                      className="h-11"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  {features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {features.map((feature, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {feature}
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(feature)}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description with AI Generation */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-base font-medium">Description</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateAIDescription}
                          disabled={isGeneratingDescription}
                          className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
                        >
                          {isGeneratingDescription ? (
                            <>
                              <div className="animate-spin h-4 w-4 mr-2 rounded-full border-2 border-purple-600 border-t-transparent" />
                              Generating...
                            </>
                          ) : (
                            <>
                              ✨ Generate with AI
                            </>
                          )}
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter product description or use AI to generate one" 
                          rows={6}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Price and Original Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Price *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            className="h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="originalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Original Price</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            className="h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Stock Quantity */}
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        {isRestaurant || watchProductType === 'food' ? 'Available Quantity *' : 'Stock Quantity *'}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          className="h-11"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Food-specific fields */}
                {(isRestaurant || watchProductType === 'food') && (
                  <div className="space-y-6 border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Food Item Details</h3>
                    
                    {/* Preparation Time */}
                    <FormField
                      control={form.control}
                      name="preparationTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Preparation Time</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 15-20 mins" 
                              className="h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Spice Level */}
                    <FormField
                      control={form.control}
                      name="spiceLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Spice Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select spice level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="mild">Mild</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hot">Hot</SelectItem>
                              <SelectItem value="extra-hot">Extra Hot</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Dietary Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="isVegetarian"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Vegetarian</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Contains no meat
                              </div>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isVegan"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Vegan</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                No animal products
                              </div>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Ingredients */}
                    <div className="space-y-4">
                      <FormLabel className="text-base font-medium">Ingredients</FormLabel>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add ingredient"
                          value={newIngredient}
                          onChange={(e) => setNewIngredient(e.target.value)}
                          className="h-11 flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIngredient())}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleAddIngredient}
                          className="h-11"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                      {ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {ingredients.map((ingredient, index) => (
                            <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {ingredient}
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredient(ingredient)}
                                className="ml-2 text-blue-600 hover:text-blue-800"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Allergens */}
                    <div className="space-y-4">
                      <FormLabel className="text-base font-medium">Allergens</FormLabel>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add allergen"
                          value={newAllergen}
                          onChange={(e) => setNewAllergen(e.target.value)}
                          className="h-11 flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergen())}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleAddAllergen}
                          className="h-11"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                      {allergens.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {allergens.map((allergen, index) => (
                            <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              {allergen}
                              <button
                                type="button"
                                onClick={() => handleRemoveAllergen(allergen)}
                                className="ml-2 text-red-600 hover:text-red-800"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Nutrition Info */}
                    <FormField
                      control={form.control}
                      name="nutritionInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Nutrition Information</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="e.g., Calories: 350, Protein: 15g, Carbs: 45g, Fat: 12g" 
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Product Images */}
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <AIImageUpload
                        label="Product Images"
                        maxImages={6}
                        minImages={1}
                        onImagesChange={field.onChange}
                        initialImages={field.value || []}
                        className="col-span-full"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? (isRestaurant ? "Adding Menu Item..." : "Adding Product...") 
                    : (isRestaurant ? "Add Menu Item" : "Add Product")
                  }
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}