import { useState, useEffect, useRef, useMemo } from 'react';
import { Calculator as CalculatorIcon, History, Plus, Trash2, Edit, FileText, Printer, X, Moon, Sun, Download, Loader2, Save, Clipboard, Search, Package, Tag, Percent, Info, ArrowLeft } from 'lucide-react';
import type { CalculatorProduct, CalculatorItem, Calculation } from '@/types/calculator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

const initialItem: Omit<CalculatorItem, 'id'> = { 
  name: '', 
  quantity: 1, 
  rate: 0, 
  discount: 0, 
  tax: 0 
};

export default function Calculator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [currentItem, setCurrentItem] = useState<Omit<CalculatorItem, 'id'>>(initialItem);
  const [selectedProduct, setSelectedProduct] = useState<CalculatorProduct | null>(null);

  // Fetch products for calculator
  const { data: productsData = [] } = useQuery<any[]>({
    queryKey: ['all-products-for-calculator'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Format products for calculator
  const products = useMemo(() => {
    if (!productsData || !Array.isArray(productsData)) return [];
    
    try {
      console.log('Formatting products for calculator:', productsData);
      
      const formattedProducts = productsData
        .filter(product => product && product.name && (product.price || product.price === 0))
        .map((product): CalculatorProduct => ({
          id: product.id || 0,
          name: product.name || 'Unknown Product',
          price: typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0),
          taxRate: 0
        }));
        
      console.log('Formatted products for calculator:', formattedProducts);
      return formattedProducts;
    } catch (error) {
      console.error('Error formatting products for calculator:', error);
      return [];
    }
  }, [productsData]);

  // Log when products change
  useEffect(() => {
    console.log('Calculator received products:', {
      count: products?.length || 0,
      sample: products?.slice(0, 3) || []
    });
    
    // Reset selected product if it's no longer in the products list
    if (selectedProduct && products && products.length > 0) {
      const productExists = products.some(p => p && p.id === selectedProduct.id);
      if (!productExists) {
        console.log('Selected product no longer exists in products list, resetting selection');
        setSelectedProduct(null);
        setCurrentItem(prev => ({ ...prev, name: '' }));
      }
    } else if (selectedProduct && (!products || products.length === 0)) {
      console.log('No products available, resetting selection');
      setSelectedProduct(null);
      setCurrentItem(prev => ({ ...prev, name: '' }));
    }
  }, [products, selectedProduct]);

  const [openProductSelect, setOpenProductSelect] = useState(false);

  const handleProductSelect = (product: CalculatorProduct | null) => {
    if (product) {
      const price = typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0);
      setSelectedProduct(product);
      setCurrentItem(prev => ({
        ...prev,
        name: product.name,
        rate: price,
        tax: product.taxRate || 0
      }));
      
      toast({
        title: 'Product selected',
        description: `${product.name} added to the form`,
      });
    } else {
      setSelectedProduct(null);
      setCurrentItem(prev => ({ ...prev, name: '' }));
    }
  };

  const [items, setItems] = useState<CalculatorItem[]>([]);
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('$');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [currentInput, setCurrentInput] = useState('0');
  const [previousInput, setPreviousInput] = useState('');
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNumber, setWaitingForNumber] = useState(false);

  // Calculator functions
  const clearCalculator = () => {
    setCurrentInput('0');
    setPreviousInput('');
    setOperation(null);
    setWaitingForNumber(false);
  };

  const appendNumber = (num: string) => {
    if (waitingForNumber) {
      setCurrentInput(num);
      setWaitingForNumber(false);
    } else {
      setCurrentInput(currentInput === '0' ? num : currentInput + num);
    }
  };

  const appendDecimal = () => {
    if (waitingForNumber) {
      setCurrentInput('0.');
      setWaitingForNumber(false);
    } else if (!currentInput.includes('.')) {
      setCurrentInput(currentInput + '.');
    }
  };

  const chooseOperation = (nextOperation: string) => {
    if (currentInput === '') return;
    
    if (previousInput !== '') {
      calculate();
    }
    
    setOperation(nextOperation);
    setPreviousInput(currentInput);
    setWaitingForNumber(true);
  };

  const calculate = () => {
    if (operation === null || previousInput === '' || currentInput === '') {
      return;
    }
    
    const prev = parseFloat(previousInput);
    const current = parseFloat(currentInput);
    let result = 0;
    
    switch (operation) {
      case '+':
        result = prev + current;
        break;
      case '-':
        result = prev - current;
        break;
      case '*':
        result = prev * current;
        break;
      case '/':
        result = current !== 0 ? prev / current : 0;
        break;
      default:
        return;
    }
    
    setCurrentInput(result.toString());
    setOperation(null);
    setPreviousInput('');
    setWaitingForNumber(true);
  };

  // Item management functions
  const addItem = () => {
    if (!currentItem.name || currentItem.rate <= 0) {
      toast({
        title: 'Invalid item',
        description: 'Please fill in item name and rate',
        variant: 'destructive'
      });
      return;
    }

    const newItem: CalculatorItem = {
      id: Date.now().toString(),
      ...currentItem
    };

    if (editingItemId) {
      setItems(prev => prev.map(item => item.id === editingItemId ? newItem : item));
      setEditingItemId(null);
      toast({
        title: 'Item updated',
        description: 'Item has been updated successfully'
      });
    } else {
      setItems(prev => [...prev, newItem]);
      toast({
        title: 'Item added',
        description: 'Item has been added to the invoice'
      });
    }

    setCurrentItem(initialItem);
    setSelectedProduct(null);
  };

  const editItem = (item: CalculatorItem) => {
    setCurrentItem(item);
    setEditingItemId(item.id);
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    if (editingItemId === id) {
      setCurrentItem(initialItem);
      setEditingItemId(null);
    }
    toast({
      title: 'Item removed',
      description: 'Item has been removed from the invoice'
    });
  };

  const clearAllItems = () => {
    setItems([]);
    setCurrentItem(initialItem);
    setEditingItemId(null);
    setSelectedProduct(null);
    toast({
      title: 'All items cleared',
      description: 'All items have been removed from the invoice'
    });
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.rate;
    const discountAmount = (itemTotal * item.discount) / 100;
    return sum + (itemTotal - discountAmount);
  }, 0);

  const totalTax = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.rate;
    const discountAmount = (itemTotal * item.discount) / 100;
    const taxableAmount = itemTotal - discountAmount;
    return sum + (taxableAmount * item.tax) / 100;
  }, 0);

  const grandTotal = subtotal + totalTax;

  // Save calculation
  const saveCalculation = () => {
    if (items.length === 0) {
      toast({
        title: 'No items',
        description: 'Please add items before saving',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    
    setTimeout(() => {
      const newCalculation: Calculation = {
        id: Date.now().toString(),
        date: new Date(),
        items: [...items],
        subtotal,
        totalTax,
        grandTotal,
        notes,
        currency
      };

      setCalculations(prev => [newCalculation, ...prev]);
      
      // Clear current calculation
      setItems([]);
      setCurrentItem(initialItem);
      setNotes('');
      setEditingItemId(null);
      setSelectedProduct(null);

      setIsSaving(false);
      toast({
        title: 'Calculation saved',
        description: 'Your calculation has been saved to history'
      });
    }, 1000);
  };

  const loadCalculation = (calculation: Calculation) => {
    setItems(calculation.items);
    setNotes(calculation.notes);
    setCurrency(calculation.currency);
    toast({
      title: 'Calculation loaded',
      description: 'Calculation has been loaded for editing'
    });
  };

  const deleteCalculation = (id: string) => {
    setCalculations(prev => prev.filter(calc => calc.id !== id));
    toast({
      title: 'Calculation deleted',
      description: 'Calculation has been removed from history'
    });
  };

  // Print and export functions
  const printInvoice = () => {
    if (items.length === 0) {
      toast({
        title: 'No items',
        description: 'Please add items before printing',
        variant: 'destructive'
      });
      return;
    }
    window.print();
  };

  const exportToCSV = () => {
    if (items.length === 0) {
      toast({
        title: 'No items',
        description: 'Please add items before exporting',
        variant: 'destructive'
      });
      return;
    }

    const headers = ['Item', 'Quantity', 'Rate', 'Discount %', 'Tax %', 'Total'];
    const csvContent = [
      headers.join(','),
      ...items.map(item => {
        const itemTotal = item.quantity * item.rate;
        const discountAmount = (itemTotal * item.discount) / 100;
        const taxableAmount = itemTotal - discountAmount;
        const taxAmount = (taxableAmount * item.tax) / 100;
        const total = taxableAmount + taxAmount;
        
        return [
          `"${item.name}"`,
          item.quantity,
          item.rate,
          item.discount,
          item.tax,
          total.toFixed(2)
        ].join(',');
      }),
      '',
      `Subtotal,,,,,${subtotal.toFixed(2)}`,
      `Tax,,,,,${totalTax.toFixed(2)}`,
      `Total,,,,,${grandTotal.toFixed(2)}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export successful',
      description: 'Invoice exported as CSV file'
    });
  };

  const copyToClipboard = async () => {
    if (items.length === 0) {
      toast({
        title: 'No items',
        description: 'Please add items before copying',
        variant: 'destructive'
      });
      return;
    }

    const invoiceText = [
      `Invoice - ${format(new Date(), 'dd/MM/yyyy')}`,
      ''.padEnd(40, '-'),
      ...items.map(item => {
        const itemTotal = item.quantity * item.rate;
        const discountAmount = (itemTotal * item.discount) / 100;
        const taxableAmount = itemTotal - discountAmount;
        const taxAmount = (taxableAmount * item.tax) / 100;
        const total = taxableAmount + taxAmount;
        
        return `${item.name} x${item.quantity} @ ${currency}${item.rate} = ${currency}${total.toFixed(2)}`;
      }),
      ''.padEnd(40, '-'),
      `Subtotal: ${currency}${subtotal.toFixed(2)}`,
      `Tax: ${currency}${totalTax.toFixed(2)}`,
      `Total: ${currency}${grandTotal.toFixed(2)}`,
      notes ? `\nNotes: ${notes}` : ''
    ].join('\n');

    try {
      await navigator.clipboard.writeText(invoiceText);
      toast({
        title: 'Copied to clipboard',
        description: 'Invoice has been copied to clipboard'
      });
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  // Filter calculations for search
  const filteredCalculations = calculations.filter(calc =>
    calc.items.some(item => 
      item.name.toLowerCase().includes(historySearchTerm.toLowerCase())
    ) || 
    calc.notes.toLowerCase().includes(historySearchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <Link href="/seller/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CalculatorIcon className="h-6 w-6" />
                  Calculator & Invoice Generator
                </h1>
                <p className="text-sm text-muted-foreground">
                  Create invoices and perform calculations for your business
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="calculator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="invoice">Invoice Generator</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Calculator</CardTitle>
                <CardDescription>Perform basic calculations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-sm mx-auto">
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
                    <div className="text-right text-2xl font-mono">
                      {currentInput}
                    </div>
                    {operation && previousInput && (
                      <div className="text-right text-sm text-gray-500">
                        {previousInput} {operation}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    <Button onClick={clearCalculator} variant="destructive" className="col-span-2">
                      Clear
                    </Button>
                    <Button onClick={() => chooseOperation('/')} variant="outline">
                      ÷
                    </Button>
                    <Button onClick={() => chooseOperation('*')} variant="outline">
                      ×
                    </Button>
                    
                    {[7, 8, 9].map(num => (
                      <Button key={num} onClick={() => appendNumber(num.toString())} variant="outline">
                        {num}
                      </Button>
                    ))}
                    <Button onClick={() => chooseOperation('-')} variant="outline">
                      −
                    </Button>
                    
                    {[4, 5, 6].map(num => (
                      <Button key={num} onClick={() => appendNumber(num.toString())} variant="outline">
                        {num}
                      </Button>
                    ))}
                    <Button onClick={() => chooseOperation('+')} variant="outline" className="row-span-2">
                      +
                    </Button>
                    
                    {[1, 2, 3].map(num => (
                      <Button key={num} onClick={() => appendNumber(num.toString())} variant="outline">
                        {num}
                      </Button>
                    ))}
                    
                    <Button onClick={() => appendNumber('0')} variant="outline" className="col-span-2">
                      0
                    </Button>
                    <Button onClick={appendDecimal} variant="outline">
                      .
                    </Button>
                    <Button onClick={calculate} variant="default">
                      =
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoice Generator Tab */}
          <TabsContent value="invoice" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Panel - Form */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Add Item</CardTitle>
                    <CardDescription>Add items to your invoice</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Product Selection */}
                    <div className="space-y-2">
                      <Label>Select Product (Optional)</Label>
                      <Popover open={openProductSelect} onOpenChange={setOpenProductSelect}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openProductSelect}
                            className="w-full justify-between"
                            disabled={!products || products.length === 0}
                          >
                            {selectedProduct ? (
                              <span className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                {selectedProduct.name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                {!products || products.length === 0 ? 'No products available' : 'Select a product...'}
                              </span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search products..." />
                            <CommandEmpty>No products found.</CommandEmpty>
                            <CommandGroup>
                              <ScrollArea className="h-48">
                                {products?.map((product) => (
                                  <CommandItem
                                    key={product.id}
                                    value={product.name}
                                    onSelect={() => {
                                      handleProductSelect(product);
                                      setOpenProductSelect(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedProduct?.id === product.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span>{product.name}</span>
                                      <span className="text-sm text-muted-foreground">
                                        ${typeof product.price === 'string' ? parseFloat(product.price).toFixed(2) : product.price.toFixed(2)}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </ScrollArea>
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {selectedProduct && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleProductSelect(null)}
                          className="text-muted-foreground"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear selection
                        </Button>
                      )}
                    </div>

                    {/* Manual Item Entry */}
                    <div className="space-y-2">
                      <Label>Item Name</Label>
                      <Input
                        placeholder="Enter item name"
                        value={currentItem.name}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={currentItem.quantity}
                          onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rate ({currency})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={currentItem.rate}
                          onChange={(e) => setCurrentItem(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Discount (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={currentItem.discount}
                          onChange={(e) => setCurrentItem(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tax (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={currentItem.tax}
                          onChange={(e) => setCurrentItem(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>

                    <Button onClick={addItem} className="w-full">
                      {editingItemId ? (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Update Item
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Input
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        placeholder="$"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional notes..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - Invoice Preview */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Preview</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveCalculation} disabled={isSaving || items.length === 0}>
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="outline" onClick={printInvoice}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                      <Button size="sm" variant="outline" onClick={exportToCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button size="sm" variant="outline" onClick={copyToClipboard}>
                        <Clipboard className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      {items.length > 0 && (
                        <Button size="sm" variant="destructive" onClick={clearAllItems}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div ref={invoiceRef} className="space-y-4">
                      <div className="border-b pb-4">
                        <h3 className="text-lg font-semibold">Invoice</h3>
                        <p className="text-sm text-muted-foreground">
                          Date: {format(new Date(), 'dd/MM/yyyy')}
                        </p>
                      </div>

                      {items.length > 0 ? (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead className="w-20">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {items.map((item) => {
                                const itemTotal = item.quantity * item.rate;
                                const discountAmount = (itemTotal * item.discount) / 100;
                                const taxableAmount = itemTotal - discountAmount;
                                const taxAmount = (taxableAmount * item.tax) / 100;
                                const total = taxableAmount + taxAmount;

                                return (
                                  <TableRow key={item.id}>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">{item.name}</div>
                                        {(item.discount > 0 || item.tax > 0) && (
                                          <div className="text-xs text-muted-foreground">
                                            {item.discount > 0 && `${item.discount}% discount`}
                                            {item.discount > 0 && item.tax > 0 && ', '}
                                            {item.tax > 0 && `${item.tax}% tax`}
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>{currency}{item.rate.toFixed(2)}</TableCell>
                                    <TableCell>{currency}{total.toFixed(2)}</TableCell>
                                    <TableCell>
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => editItem(item)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => deleteItem(item.id)}
                                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>

                          <Separator />

                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>{currency}{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tax:</span>
                              <span>{currency}{totalTax.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                              <span>Total:</span>
                              <span>{currency}{grandTotal.toFixed(2)}</span>
                            </div>
                          </div>

                          {notes && (
                            <>
                              <Separator />
                              <div>
                                <p className="text-sm font-medium">Notes:</p>
                                <p className="text-sm text-muted-foreground">{notes}</p>
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No items added yet</p>
                          <p className="text-sm">Add items to generate an invoice</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Calculation History</CardTitle>
                <CardDescription>View and manage your saved calculations</CardDescription>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search calculations..."
                      value={historySearchTerm}
                      onChange={(e) => setHistorySearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredCalculations.length > 0 ? (
                  <div className="space-y-4">
                    {filteredCalculations.map((calculation) => (
                      <Card key={calculation.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <History className="h-4 w-4" />
                                <span className="font-medium">
                                  {format(calculation.date, 'dd/MM/yyyy HH:mm')}
                                </span>
                                <Badge variant="secondary">
                                  {calculation.items.length} item(s)
                                </Badge>
                              </div>
                              <div className="text-lg font-bold">
                                Total: {calculation.currency}{calculation.grandTotal.toFixed(2)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Items: {calculation.items.map(item => item.name).join(', ')}
                              </div>
                              {calculation.notes && (
                                <div className="text-sm">
                                  <span className="font-medium">Notes:</span> {calculation.notes}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadCalculation(calculation)}
                              >
                                Load
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteCalculation(calculation.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No calculations found</p>
                    <p className="text-sm">Your saved calculations will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}