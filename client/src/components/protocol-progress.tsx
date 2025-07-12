import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  Circle, 
  AlertTriangle, 
  MapPin, 
  Camera, 
  TreePine, 
  Eye, 
  Grid3X3,
  Navigation,
  Timer,
  Target,
  ChevronRight,
  ChevronLeft,
  SkipForward
} from "lucide-react"

interface ProtocolTemplate {
  id: string
  name: string
  samplingPattern: string
  numberOfPoints: number
  toolsEnabled: string[]
  estimatedTime?: number
  instructions?: string
  gpsRequired: boolean
  weatherRecording: boolean
}

interface ProtocolPoint {
  index: number
  latitude?: number
  longitude?: number
  gpsAccuracy?: number
  completed: boolean
  toolsCompleted: string[]
  issues: ProtocolIssue[]
  notes?: string
  timestamp?: Date
}

interface ProtocolIssue {
  type: 'gps_accuracy' | 'photo_quality' | 'missing_data' | 'validation_failed'
  severity: 'warning' | 'error'
  message: string
  resolved: boolean
}

interface ProtocolProgressProps {
  protocol: ProtocolTemplate
  onPointCompleted: (pointIndex: number, data: any) => void
  onProtocolCompleted: () => void
  onNavigateToPoint: (pointIndex: number) => void
  currentLocation?: { latitude: number; longitude: number; accuracy: number }
}

export default function ProtocolProgress({
  protocol,
  onPointCompleted,
  onProtocolCompleted,
  onNavigateToPoint,
  currentLocation
}: ProtocolProgressProps) {
  const [points, setPoints] = useState<ProtocolPoint[]>([])
  const [currentPointIndex, setCurrentPointIndex] = useState(0)
  const [sessionStartTime] = useState(new Date())
  const [elapsedTime, setElapsedTime] = useState(0)

  // Initialize protocol points
  useEffect(() => {
    const initialPoints: ProtocolPoint[] = Array.from(
      { length: protocol.numberOfPoints },
      (_, index) => ({
        index,
        completed: false,
        toolsCompleted: [],
        issues: []
      })
    )
    setPoints(initialPoints)
  }, [protocol])

  // Update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - sessionStartTime.getTime())
    }, 1000)
    return () => clearInterval(interval)
  }, [sessionStartTime])

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getCurrentPoint = (): ProtocolPoint => {
    return points[currentPointIndex] || {
      index: currentPointIndex,
      completed: false,
      toolsCompleted: [],
      issues: []
    }
  }

  const getCompletedPointsCount = (): number => {
    return points.filter(p => p.completed).length
  }

  const getOverallProgress = (): number => {
    return (getCompletedPointsCount() / protocol.numberOfPoints) * 100
  }

  const getToolProgress = (): { completed: number; total: number } => {
    const currentPoint = getCurrentPoint()
    return {
      completed: currentPoint.toolsCompleted.length,
      total: protocol.toolsEnabled.length
    }
  }

  const getEstimatedCompletion = (): Date | null => {
    const completedPoints = getCompletedPointsCount()
    if (completedPoints === 0) return null
    
    const avgTimePerPoint = elapsedTime / completedPoints
    const remainingPoints = protocol.numberOfPoints - completedPoints
    const remainingTime = remainingPoints * avgTimePerPoint
    
    return new Date(Date.now() + remainingTime)
  }

  const hasGpsIssue = (): boolean => {
    if (!protocol.gpsRequired || !currentLocation) return false
    return currentLocation.accuracy > 5 // 5 meter threshold
  }

  const getActiveIssues = (): ProtocolIssue[] => {
    const currentPoint = getCurrentPoint()
    return currentPoint.issues.filter(issue => !issue.resolved)
  }

  const handleToolCompleted = (toolType: string, data: any) => {
    const updatedPoints = [...points]
    const currentPoint = updatedPoints[currentPointIndex]
    
    if (!currentPoint.toolsCompleted.includes(toolType)) {
      currentPoint.toolsCompleted.push(toolType)
    }
    
    // Add GPS data if available
    if (currentLocation) {
      currentPoint.latitude = currentLocation.latitude
      currentPoint.longitude = currentLocation.longitude
      currentPoint.gpsAccuracy = currentLocation.accuracy
    }
    
    currentPoint.timestamp = new Date()
    
    // Check if point is complete
    if (currentPoint.toolsCompleted.length === protocol.toolsEnabled.length) {
      currentPoint.completed = true
      onPointCompleted(currentPointIndex, {
        ...data,
        pointIndex: currentPointIndex,
        location: currentLocation,
        toolsCompleted: currentPoint.toolsCompleted
      })
    }
    
    setPoints(updatedPoints)
    
    // Check if protocol is complete
    if (updatedPoints.every(p => p.completed)) {
      onProtocolCompleted()
    }
  }

  const handleNextPoint = () => {
    if (currentPointIndex < protocol.numberOfPoints - 1) {
      setCurrentPointIndex(currentPointIndex + 1)
      onNavigateToPoint(currentPointIndex + 1)
    }
  }

  const handlePreviousPoint = () => {
    if (currentPointIndex > 0) {
      setCurrentPointIndex(currentPointIndex - 1)
      onNavigateToPoint(currentPointIndex - 1)
    }
  }

  const handleSkipPoint = () => {
    const updatedPoints = [...points]
    updatedPoints[currentPointIndex].issues.push({
      type: 'missing_data',
      severity: 'warning',
      message: 'Point skipped by user',
      resolved: false
    })
    setPoints(updatedPoints)
    handleNextPoint()
  }

  const getToolIcon = (tool: string) => {
    switch (tool) {
      case 'canopy': return <TreePine className="h-4 w-4" />
      case 'horizontal': return <Eye className="h-4 w-4" />
      case 'ground': return <Grid3X3 className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getSamplingPatternInfo = () => {
    switch (protocol.samplingPattern) {
      case 'grid':
        return 'Follow systematic grid pattern. Maintain consistent spacing between points.'
      case 'transect':
        return 'Follow linear transect path. Take measurements at regular intervals.'
      case 'random':
        return 'Navigate to randomly selected coordinates. Use GPS for precise location.'
      case 'systematic':
        return 'Use systematic sampling approach. Maintain consistent methodology.'
      default:
        return 'Follow the specified sampling pattern for this protocol.'
    }
  }

  const currentPoint = getCurrentPoint()
  const toolProgress = getToolProgress()
  const activeIssues = getActiveIssues()

  return (
    <div className="space-y-4">
      {/* Protocol Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>{protocol.name}</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {getSamplingPatternInfo()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {getCompletedPointsCount()}/{protocol.numberOfPoints}
              </div>
              <div className="text-xs text-muted-foreground">Points Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Protocol Progress</span>
                <span>{Math.round(getOverallProgress())}%</span>
              </div>
              <Progress value={getOverallProgress()} className="h-2" />
            </div>

            {/* Time and Estimates */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold">{formatTime(elapsedTime)}</div>
                <div className="text-xs text-muted-foreground">Elapsed</div>
              </div>
              <div>
                <div className="text-lg font-bold">
                  {protocol.estimatedTime ? `${protocol.estimatedTime}min` : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">Estimated</div>
              </div>
              <div>
                <div className="text-lg font-bold">
                  {getEstimatedCompletion() 
                    ? formatTime(getEstimatedCompletion()!.getTime() - Date.now())
                    : 'N/A'
                  }
                </div>
                <div className="text-xs text-muted-foreground">Remaining</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Point Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Point {currentPointIndex + 1}</span>
            </span>
            <div className="flex items-center space-x-2">
              {currentPoint.completed ? (
                <Badge variant="default">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Circle className="h-3 w-3 mr-1" />
                  In Progress
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GPS Status */}
          {protocol.gpsRequired && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <Navigation className="h-4 w-4" />
                <span className="text-sm font-medium">GPS Location</span>
              </div>
              <div className="text-right">
                {currentLocation ? (
                  <div>
                    <div className="text-sm font-mono">
                      {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </div>
                    <div className={`text-xs ${hasGpsIssue() ? 'text-destructive' : 'text-muted-foreground'}`}>
                      Accuracy: ±{currentLocation.accuracy.toFixed(1)}m
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Acquiring...</div>
                )}
              </div>
            </div>
          )}

          {/* Tool Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Tool Progress</span>
              <span>{toolProgress.completed}/{toolProgress.total}</span>
            </div>
            <div className="space-y-2">
              {protocol.toolsEnabled.map((tool) => (
                <div key={tool} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    {getToolIcon(tool)}
                    <span className="capitalize">{tool} Analysis</span>
                  </div>
                  <div>
                    {currentPoint.toolsCompleted.includes(tool) ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          {activeIssues.length > 0 && (
            <div className="space-y-2">
              {activeIssues.map((issue, index) => (
                <Alert key={index} variant={issue.severity === 'error' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{issue.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handlePreviousPoint}
              disabled={currentPointIndex === 0}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSkipPoint}
              disabled={currentPoint.completed}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleNextPoint}
              disabled={currentPointIndex === protocol.numberOfPoints - 1}
              className="flex-1"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {points.map((point, index) => (
              <Button
                key={index}
                variant={index === currentPointIndex ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCurrentPointIndex(index)
                  onNavigateToPoint(index)
                }}
                className={`relative ${point.completed ? 'bg-green-100 border-green-300' : ''}`}
              >
                {point.completed && (
                  <CheckCircle className="absolute -top-1 -right-1 h-3 w-3 text-green-600" />
                )}
                {point.issues.length > 0 && !point.completed && (
                  <AlertTriangle className="absolute -top-1 -right-1 h-3 w-3 text-yellow-600" />
                )}
                {index + 1}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      {protocol.instructions && (
        <Card>
          <CardHeader>
            <CardTitle>Protocol Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{protocol.instructions}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 