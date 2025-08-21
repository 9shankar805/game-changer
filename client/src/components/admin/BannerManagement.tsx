import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Eye, EyeOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  description?: string;
  position: string;
  isActive: boolean;
  displayOrder: number;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
}

interface BannerFormData {
  title: string;
  imageUrl: string;
  linkUrl: string;
  description: string;
  position: string;
  isActive: boolean;
  displayOrder: number;
  startsAt: string;
  endsAt: string;
}

export default function BannerManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<BannerFormData>({
    title: '',
    imageUrl: '',
    linkUrl: '',
    description: '',
    position: 'main',
    isActive: true,
    displayOrder: 0,
    startsAt: '',
    endsAt: ''
  });

  // Fetch banners
  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['/api/admin/banners'],
    queryFn: async () => {
      const response = await fetch('/api/admin/banners');
      if (!response.ok) throw new Error('Failed to fetch banners');
      return response.json();
    }
  });

  // Create banner mutation
  const createBannerMutation = useMutation({
    mutationFn: async (data: BannerFormData) => {
      const response = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create banner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Banner created and notification sent!');
    },
    onError: () => {
      toast.error('Failed to create banner');
    }
  });

  // Update banner mutation
  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BannerFormData> }) => {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update banner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      setEditingBanner(null);
      resetForm();
      toast.success('Banner updated and notification sent!');
    },
    onError: () => {
      toast.error('Failed to update banner');
    }
  });

  // Delete banner mutation
  const deleteBannerMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete banner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banners'] });
      toast.success('Banner deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete banner');
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      imageUrl: '',
      linkUrl: '',
      description: '',
      position: 'main',
      isActive: true,
      displayOrder: 0,
      startsAt: '',
      endsAt: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBanner) {
      updateBannerMutation.mutate({ id: editingBanner.id, data: formData });
    } else {
      createBannerMutation.mutate(formData);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '',
      description: banner.description || '',
      position: banner.position,
      isActive: banner.isActive,
      displayOrder: banner.displayOrder,
      startsAt: banner.startsAt ? new Date(banner.startsAt).toISOString().slice(0, 16) : '',
      endsAt: banner.endsAt ? new Date(banner.endsAt).toISOString().slice(0, 16) : ''
    });
    setIsCreateDialogOpen(true);
  };

  const toggleBannerStatus = (banner: Banner) => {
    updateBannerMutation.mutate({
      id: banner.id,
      data: { isActive: !banner.isActive }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Banner Management</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? 'Edit Banner' : 'Create New Banner'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main</SelectItem>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                      <SelectItem value="footer">Footer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="linkUrl">Link URL (Optional)</Label>
                <Input
                  id="linkUrl"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startsAt">Start Date (Optional)</Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endsAt">End Date (Optional)</Label>
                  <Input
                    id="endsAt"
                    type="datetime-local"
                    value={formData.endsAt}
                    onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBannerMutation.isPending || updateBannerMutation.isPending}>
                  {editingBanner ? 'Update' : 'Create'} Banner
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="bg-gray-200 h-32 rounded mb-4"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-3 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((banner) => (
            <Card key={banner.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{banner.title}</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBannerStatus(banner)}
                    >
                      {banner.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(banner)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBannerMutation.mutate(banner.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-32 object-cover rounded"
                  />
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={banner.isActive ? "default" : "secondary"}>
                      {banner.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">{banner.position}</Badge>
                    <Badge variant="outline">Order: {banner.displayOrder}</Badge>
                  </div>
                  
                  {banner.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {banner.description}
                    </p>
                  )}
                  
                  {banner.linkUrl && (
                    <p className="text-xs text-blue-600 truncate">
                      Link: {banner.linkUrl}
                    </p>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(banner.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}