import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save } from 'lucide-react';
import AppImage from '../../components/common/AppImage';
import {
  useSeatMap,
  useUpdateSeatMap,
  useUpsertTables,
  useUploadSvg,
  useUploadPreviewImage,
} from '../../hooks/useSeatMaps';
import { extractTablesFromSvg } from '../../utils/svgParser';
import { TABLE_CATEGORIES } from '../../utils/seatMapConstants';

export const SeatMapEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: seatMap, isLoading, isError } = useSeatMap(id);
  const updateMapMutation = useUpdateSeatMap();
  const upsertTablesMutation = useUpsertTables();
  const uploadSvgMutation = useUploadSvg();
  const uploadPreviewMutation = useUploadPreviewImage();

  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [tables, setTables] = useState([]);

  // Sync state when data loads
  useEffect(() => {
    if (seatMap) {
      setName(seatMap.name || '');
      setIsActive(seatMap.is_active ?? true);
      if (seatMap.tables) {
        setTables(seatMap.tables);
      }
    }
  }, [seatMap]);

  // Handle SVG upload and extraction
  const handleSvgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 1. Read SVG text to extract tables
      const text = await file.text();
      const parsedTables = extractTablesFromSvg(text);

      // Merge parsed tables with existing settings or fallback to defaults
      const mergedTables = parsedTables.map((parsed) => {
        const existing = tables.find((t) => t.svg_element_id === parsed.svg_element_id);
        return {
          svg_element_id: parsed.svg_element_id,
          table_code: existing?.table_code || parsed.suggested_code,
          category: existing?.category || parsed.suggested_category,
          capacity: existing?.capacity || (parsed.suggested_category === 'vip' ? 8 : 4),
          price: existing?.price || (parsed.suggested_category === 'vip' ? 200 : 100),
          status: existing?.status || 'available',
        };
      });

      setTables(mergedTables);

      // 2. Upload file to Supabase Storage
      const url = await uploadSvgMutation.mutateAsync({ file, seatMapId: id });
      await updateMapMutation.mutateAsync({
        id,
        seatMapData: { svg_url: url },
      });
    } catch (err) {
      console.error('Failed to process SVG:', err);
    }
  };

  // Handle Preview Image upload
  const handlePreviewUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadPreviewMutation.mutateAsync({ file, seatMapId: id });
      await updateMapMutation.mutateAsync({
        id,
        seatMapData: { preview_image_url: url },
      });
    } catch (err) {
      console.error('Failed to upload preview image:', err);
    }
  };

  // Update a table property locally
  const handleTableChange = (index, field, value) => {
    const updated = [...tables];
    updated[index] = { ...updated[index], [field]: value };
    setTables(updated);
  };

  // Save all changes
  const handleSaveAll = async () => {
    try {
      // 1. Update basic info
      await updateMapMutation.mutateAsync({
        id,
        seatMapData: {
          name,
          is_active: isActive,
        },
      });

      // 2. Upsert tables
      if (tables.length > 0) {
        await upsertTablesMutation.mutateAsync({
          seatMapId: id,
          tablesData: tables,
        });
      }
    } catch (err) {
      console.error('Failed to save changes:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !seatMap) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        {t('admin.seatMaps.loadError', 'Failed to load seat map details.')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <button
            onClick={() => navigate('/admin/seat-maps')}
            className="text-sm text-muted-foreground hover:text-primary mb-2 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('admin.seatMaps.backToList', 'Back to Seat Maps')}</span>
          </button>
          <h1 className="text-3xl font-bold font-sans text-primary">
            {t('admin.seatMaps.editTitle', 'Edit Seat Map')}
          </h1>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={updateMapMutation.isPending || upsertTablesMutation.isPending}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span>{t('admin.seatMaps.save', 'Save Changes')}</span>
        </button>
      </div>

      {/* General Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">
            {t('admin.seatMaps.sectionGeneral', 'General Settings')}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('admin.seatMaps.name', 'Name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4 bg-background"
              />
              <span className="text-sm font-medium">
                {t('admin.seatMaps.activeLabel', 'Active (Visible to public)')}
              </span>
            </label>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">
            {t('admin.seatMaps.sectionMedia', 'Media Files')}
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('admin.seatMaps.uploadSvg', 'Upload SVG')}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".svg"
                  onChange={handleSvgUpload}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary/10 file:text-primary
                    hover:file:bg-primary/20 cursor-pointer"
                />
              </div>
              {seatMap.svg_url && (
                <p className="text-xs text-muted-foreground mt-2 break-all">
                  {t('admin.seatMaps.currentSvg', 'Current SVG')}: {seatMap.svg_url}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('admin.seatMaps.uploadPreview', 'Upload Preview Image')}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePreviewUpload}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-secondary/20 file:text-foreground
                  hover:file:bg-secondary/30 cursor-pointer"
              />
              {seatMap.preview_image_url && (
                <div className="mt-2 w-32 h-20 rounded overflow-hidden border border-border">
                  <AppImage
                    src={seatMap.preview_image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tables List */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-secondary/10 flex justify-between items-center">
          <h2 className="text-lg font-bold">{t('admin.seatMaps.tablesEditor', 'Tables Editor')}</h2>
          <span className="text-sm text-muted-foreground font-medium bg-secondary/20 px-3 py-1 rounded-full">
            {t('admin.seatMaps.tablesDetected', '{{count}} tables detected', {
              count: tables.length,
            })}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary sticky top-0 z-10 text-muted-foreground border-b border-border">
              <tr>
                <th className="p-3 font-medium border-b border-border">
                  {t('admin.seatMaps.svgId', 'SVG ID')}
                </th>
                <th className="p-3 font-medium border-b border-border">
                  {t('admin.seatMaps.tableCode', 'Table Code')}
                </th>
                <th className="p-3 font-medium border-b border-border">
                  {t('admin.seatMaps.category', 'Category')}
                </th>
                <th className="p-3 font-medium border-b border-border">
                  {t('admin.seatMaps.capacity', 'Capacity')}
                </th>
                <th className="p-3 font-medium border-b border-border">
                  {t('admin.seatMaps.price', 'Price ($)')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tables.map((table, index) => (
                <tr key={table.svg_element_id} className="hover:bg-secondary/5 transition-colors">
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {table.svg_element_id}
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={table.table_code}
                      onChange={(e) => handleTableChange(index, 'table_code', e.target.value)}
                      className="w-full bg-background border border-border rounded px-2 py-1 focus:ring-1 focus:ring-primary"
                    />
                  </td>
                  <td className="p-3">
                    <select
                      value={table.category}
                      onChange={(e) => handleTableChange(index, 'category', e.target.value)}
                      className="w-full bg-background border border-border rounded px-2 py-1 focus:ring-1 focus:ring-primary"
                    >
                      {Object.entries(TABLE_CATEGORIES).map(([key, cat]) => (
                        <option key={key} value={key}>
                          {t(cat.label)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="1"
                      value={table.capacity}
                      onChange={(e) =>
                        handleTableChange(index, 'capacity', parseInt(e.target.value))
                      }
                      className="w-20 bg-background border border-border rounded px-2 py-1 focus:ring-1 focus:ring-primary"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={table.price}
                      onChange={(e) =>
                        handleTableChange(index, 'price', parseFloat(e.target.value))
                      }
                      className="w-24 bg-background border border-border rounded px-2 py-1 focus:ring-1 focus:ring-primary"
                    />
                  </td>
                </tr>
              ))}
              {tables.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-muted-foreground italic">
                    {t(
                      'admin.seatMaps.uploadSvgHint',
                      'Upload an SVG file to automatically detect tables.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SeatMapEditorPage;
