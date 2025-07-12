import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  Save, 
  Eye, 
  Target, 
  TreePine, 
  Grid3X3, 
  MapPin, 
  Clock, 
  Camera,
  Navigation,
  Settings,
  Plus,
  Minus,
  Info
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProtocolCreatorProps {
  onProtocolCreated: (protocol: any) => void
  editingProtocol?: any
}

export default function ProtocolCreator({ onProtocolCreated, editingProtocol }: ProtocolCreatorProps) {
  const [formData, setFormData] = useState({
    // Basic info
    name: editingProtocol?.name || '',
    description: editingProtocol?.description || '',
    ecosystemType: editingProtocol?.ecosystemType || '',
    category: editingProtocol?.category || 'custom',
    
    // Sampling design
    samplingPattern: editingProtocol?.samplingPattern || 'grid',
    numberOfPoints: editingProtocol?.numberOfPoints || 10,
    pointSpacing: editingProtocol?.pointSpacing || 20,
    transectLength: editingProtocol?.transectLength || 100,
    transectCount: editingProtocol?.transectCount || 1,
    plotSize: editingProtocol?.plotSize || 400,
    
    // Tools
    toolsEnabled: editingProtocol?.toolsEnabled || [],
    
    // Requirements
    gpsRequired: editingProtocol?.gpsRequired || true,
    weatherRecording: editingProtocol?.weatherRecording || false,
    minGpsAccuracy: editingProtocol?.minGpsAccuracy || 5,
    
    // Metadata
    estimatedTime: editingProtocol?.estimatedTime || 30,
    difficultyLevel: editingProtocol?.difficultyLevel || 'beginner',
    instructions: editingProtocol?.instructions || '',
    notesTemplate: editingProtocol?.notesTemplate || '',
    tags: editingProtocol?.tags || []
  })

  const [newTag, setNewTag] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleToolToggle = (tool: string) => {
    const tools = formData.toolsEnabled.includes(tool)
      ? formData.toolsEnabled.filter((t: string) => t !== tool)
      : [...formData.toolsEnabled, tool]
    
    handleInputChange('toolsEnabled', tools)
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange('tags', [...formData.tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    handleInputChange('tags', formData.tags.filter((t: string) => t !== tag))
  }

  const calculateEstimatedTime = () => {
    let baseTime = 0
    
    // Base time per point
    baseTime += formData.numberOfPoints * 2 // 2 minutes per point base
    
    // Tool time
    if (formData.toolsEnabled.includes('canopy')) baseTime += formData.numberOfPoints * 3
    if (formData.toolsEnabled.includes('horizontal')) baseTime += formData.numberOfPoints * 2
    if (formData.toolsEnabled.includes('ground')) baseTime += formData.numberOfPoints * 4
    
    // Travel time between points
    if (formData.samplingPattern === 'random') baseTime += formData.numberOfPoints * 2
    else if (formData.samplingPattern === 'transect') baseTime += formData.transectCount * 5
    
    return Math.round(baseTime)
  }

  const validateProtocol = () => {
    const errors = []
    
    if (!formData.name.trim()) errors.push('Protocol name is required')
    if (formData.numberOfPoints < 1) errors.push('Number of points must be at least 1')
    if (formData.toolsEnabled.length === 0) errors.push('At least one tool must be selected')
    if (formData.samplingPattern === 'grid' && formData.pointSpacing <= 0) {
      errors.push('Point spacing is required for grid sampling')
    }
    if (formData.samplingPattern === 'transect' && (formData.transectLength <= 0 || formData.transectCount <= 0)) {
      errors.push('Transect length and count are required for transect sampling')
    }
    
    return errors
  }

  const handleSave = () => {
    const errors = validateProtocol()
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(', '),
        variant: "destructive"
      })
      return
    }

    const protocol = {
      ...formData,
      id: editingProtocol?.id || `custom_${Date.now()}`,
      createdBy: 'user',
      isPublic: false,
      isPreset: false,
      estimatedTime: calculateEstimatedTime()
    }

    onProtocolCreated(protocol)
    
    toast({
      title: "Protocol Saved",
      description: `${protocol.name} has been saved successfully`,
    })
  }

  const getSamplingPatternDescription = (pattern: string) => {
    switch (pattern) {
      case 'grid':
        return 'Systematic grid layout with regular spacing between points'
      case 'transect':
        return 'Linear transects with measurements at regular intervals'
      case 'random':
        return 'Randomly selected measurement locations'
      case 'systematic':
        return 'Systematic sampling with predefined intervals'
      case 'point_intercept':
        return 'Point-intercept method for ground cover assessment'
      case 'line_intercept':
        return 'Line-intercept method for vegetation measurement'
      default:
        return 'Select a sampling pattern'
    }
  }

  if (previewMode) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Protocol Preview</CardTitle>
            <Button variant="outline" onClick={() => setPreviewMode(false)}>
              <Settings className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-xl font-bold">{formData.name}</h3>
            <p className="text-muted-foreground">{formData.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Sampling Design</h4>
              <div className="space-y-1 text-sm">
                <div>Pattern: <span className="capitalize">{formData.samplingPattern}</span></div>
                <div>Points: {formData.numberOfPoints}</div>
                <div>Estimated Time: {calculateEstimatedTime()} minutes</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Tools</h4>
              <div className="flex flex-wrap gap-1">
                {formData.toolsEnabled.map((tool: string) => (
                  <Badge key={tool} variant="outline">
                    {tool === 'canopy' && <TreePine className="h-3 w-3 mr-1" />}
                    {tool === 'horizontal' && <Eye className="h-3 w-3 mr-1" />}
                    {tool === 'ground' && <Grid3X3 className="h-3 w-3 mr-1" />}
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {formData.instructions && (
            <div>
              <h4 className="font-medium mb-2">Instructions</h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                {formData.instructions}
              </p>
            </div>
          )}

          <div className="flex space-x-2">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Protocol
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {editingProtocol ? 'Edit Protocol' : 'Create Protocol'}
          </h2>
          <p className="text-muted-foreground">
            Design a custom measurement protocol for your research needs
          </p>
        </div>
        <Button variant="outline" onClick={() => setPreviewMode(true)}>
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="sampling">Sampling</TabsTrigger>
          <TabsTrigger value="tools">Tools & Data</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Protocol Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Custom Forest Survey"
                  />
                </div>
                <div>
                  <Label htmlFor="ecosystem">Ecosystem Type</Label>
                  <Select 
                    value={formData.ecosystemType} 
                    onValueChange={(value) => handleInputChange('ecosystemType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ecosystem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="forest">Forest</SelectItem>
                      <SelectItem value="grassland">Grassland</SelectItem>
                      <SelectItem value="riparian">Riparian</SelectItem>
                      <SelectItem value="wetland">Wetland</SelectItem>
                      <SelectItem value="urban">Urban</SelectItem>
                      <SelectItem value="agricultural">Agricultural</SelectItem>
                      <SelectItem value="coastal">Coastal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the protocol purpose and methodology..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select 
                  value={formData.difficultyLevel} 
                  onValueChange={(value) => handleInputChange('difficultyLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button onClick={handleAddTag} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer">
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sampling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sampling Design</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pattern">Sampling Pattern *</Label>
                <Select 
                  value={formData.samplingPattern} 
                  onValueChange={(value) => handleInputChange('samplingPattern', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="transect">Transect</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                    <SelectItem value="systematic">Systematic</SelectItem>
                    <SelectItem value="point_intercept">Point Intercept</SelectItem>
                    <SelectItem value="line_intercept">Line Intercept</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {getSamplingPatternDescription(formData.samplingPattern)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="points">Number of Points *</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[formData.numberOfPoints]}
                      onValueChange={([value]) => handleInputChange('numberOfPoints', value)}
                      max={100}
                      min={1}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1</span>
                      <span className="font-medium">{formData.numberOfPoints} points</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>

                {formData.samplingPattern === 'grid' && (
                  <div>
                    <Label htmlFor="spacing">Point Spacing (meters)</Label>
                    <Input
                      id="spacing"
                      type="number"
                      value={formData.pointSpacing}
                      onChange={(e) => handleInputChange('pointSpacing', parseInt(e.target.value))}
                      min="1"
                    />
                  </div>
                )}

                {formData.samplingPattern === 'transect' && (
                  <>
                    <div>
                      <Label htmlFor="transect-length">Transect Length (meters)</Label>
                      <Input
                        id="transect-length"
                        type="number"
                        value={formData.transectLength}
                        onChange={(e) => handleInputChange('transectLength', parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="transect-count">Number of Transects</Label>
                      <Input
                        id="transect-count"
                        type="number"
                        value={formData.transectCount}
                        onChange={(e) => handleInputChange('transectCount', parseInt(e.target.value))}
                        min="1"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="plot-size">Plot Size (m²)</Label>
                  <Input
                    id="plot-size"
                    type="number"
                    value={formData.plotSize}
                    onChange={(e) => handleInputChange('plotSize', parseInt(e.target.value))}
                    min="1"
                  />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Estimated Time</span>
                </div>
                <div className="text-2xl font-bold">{calculateEstimatedTime()} minutes</div>
                <p className="text-xs text-muted-foreground">
                  Calculated based on number of points, tools selected, and sampling pattern
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Measurement Tools *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  { id: 'canopy', name: 'Canopy Analysis', icon: TreePine, description: 'Measure canopy cover and light transmission' },
                  { id: 'horizontal', name: 'Horizontal Vegetation', icon: Eye, description: 'Assess vegetation density at different heights' },
                  { id: 'ground', name: 'Ground Cover', icon: Grid3X3, description: 'Analyze ground layer vegetation and species' }
                ].map((tool) => (
                  <div key={tool.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={formData.toolsEnabled.includes(tool.id)}
                      onCheckedChange={() => handleToolToggle(tool.id)}
                    />
                    <tool.icon className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-sm text-muted-foreground">{tool.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div>
                <Label htmlFor="instructions">Field Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  placeholder="Detailed instructions for field researchers..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="notes-template">Notes Template</Label>
                <Textarea
                  id="notes-template"
                  value={formData.notesTemplate}
                  onChange={(e) => handleInputChange('notesTemplate', e.target.value)}
                  placeholder="Weather conditions:&#10;Site notes:&#10;Disturbances observed:&#10;Other observations:"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Control & Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Navigation className="h-5 w-5" />
                    <div>
                      <div className="font-medium">GPS Required</div>
                      <div className="text-sm text-muted-foreground">
                        Require GPS coordinates for each measurement point
                      </div>
                    </div>
                  </div>
                  <Checkbox
                    checked={formData.gpsRequired}
                    onCheckedChange={(checked) => handleInputChange('gpsRequired', checked)}
                  />
                </div>

                {formData.gpsRequired && (
                  <div>
                    <Label htmlFor="gps-accuracy">Minimum GPS Accuracy (meters)</Label>
                    <Input
                      id="gps-accuracy"
                      type="number"
                      value={formData.minGpsAccuracy}
                      onChange={(e) => handleInputChange('minGpsAccuracy', parseInt(e.target.value))}
                      min="1"
                      max="50"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Camera className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Weather Recording</div>
                      <div className="text-sm text-muted-foreground">
                        Record weather conditions during measurements
                      </div>
                    </div>
                  </div>
                  <Checkbox
                    checked={formData.weatherRecording}
                    onCheckedChange={(checked) => handleInputChange('weatherRecording', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-2">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {editingProtocol ? 'Update Protocol' : 'Save Protocol'}
            </Button>
            <Button variant="outline" onClick={() => setPreviewMode(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 