import React, { useState, useRef, useEffect, DragEvent } from 'react';
import { Cat, Dog, Circle, User, Plus, Play, Pause, Trash2, RotateCcw, ArrowRight, ArrowDown, RotateCw, Move, Command as Random, MessageCircle, Maximize2, Minimize2, Repeat, Settings, FileText, Edit, BookOpen, Bug, Volume2, Shirt } from 'lucide-react';

interface Sprite {
  id: string;
  type: 'cat' | 'dog' | 'ball' | 'human';
  x: number;
  y: number;
  direction: number;
  saying: string;
  thinking: string;
  animation: Animation[];
  size: number;
  velocityX: number;
  velocityY: number;
  isAnimating: boolean;
}

interface Animation {
  type: 'move' | 'turn' | 'goto' | 'say' | 'think' | 'moveX' | 'moveY' | 'size' | 'random';
  value: number;
  duration?: number;
  x?: number;
  y?: number;
  repeat?: number;
}

interface ActionBlock {
  id: string;
  type: Animation['type'];
  value: number;
  duration?: number;
  x?: number;
  y?: number;
  repeat?: number;
  label: string;
}

function App() {
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const [selectedSprite, setSelectedSprite] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [actionBlocks, setActionBlocks] = useState<{ [spriteId: string]: ActionBlock[] }>({});
  const animationFrameRef = useRef<number>();
  const stageRef = useRef<HTMLDivElement>(null);

  const addSprite = (type: Sprite['type']) => {
    const newSprite: Sprite = {
      id: `sprite-${Date.now()}`,
      type,
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
      direction: 0,
      saying: '',
      thinking: '',
      animation: [],
      size: 1,
      velocityX: 0,
      velocityY: 0,
      isAnimating: false
    };
    setSprites(prev => [...prev, newSprite]);
    setSelectedSprite(newSprite.id);
  };

  const checkCollision = (sprite1: Sprite, sprite2: Sprite) => {
    const size1 = 48 * sprite1.size;
    const size2 = 48 * sprite2.size;
    
    return Math.abs(sprite1.x - sprite2.x) < (size1 + size2) / 2 &&
           Math.abs(sprite1.y - sprite2.y) < (size1 + size2) / 2;
  };

  const handleCollisions = (sprites: Sprite[]) => {
    for (let i = 0; i < sprites.length; i++) {
      for (let j = i + 1; j < sprites.length; j++) {
        if (checkCollision(sprites[i], sprites[j])) {
          // Swap velocities
          const tempVelocityX = sprites[i].velocityX;
          const tempVelocityY = sprites[i].velocityY;
          
          sprites[i].velocityX = sprites[j].velocityX;
          sprites[i].velocityY = sprites[j].velocityY;
          
          sprites[j].velocityX = tempVelocityX;
          sprites[j].velocityY = tempVelocityY;

          // Adjust positions to prevent sticking
          const dx = sprites[j].x - sprites[i].x;
          const dy = sprites[j].y - sprites[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = (48 * sprites[i].size + 48 * sprites[j].size) / 2;
          
          if (distance < minDistance) {
            const scale = (minDistance - distance) / distance;
            sprites[i].x -= dx * scale / 2;
            sprites[i].y -= dy * scale / 2;
            sprites[j].x += dx * scale / 2;
            sprites[j].y += dy * scale / 2;
          }

          // Make sprites say something on collision
          sprites[i].saying = "Swapping!";
          sprites[j].saying = "Bouncing!";

          setTimeout(() => {
            setSprites(prev => prev.map(sprite => 
              (sprite.id === sprites[i].id || sprite.id === sprites[j].id) 
                ? { ...sprite, saying: '' }
                : sprite
            ));
          }, 1000);

          // Swap action blocks
          const sprite1Actions = actionBlocks[sprites[i].id] || [];
          const sprite2Actions = actionBlocks[sprites[j].id] || [];
          
          setActionBlocks(prev => ({
            ...prev,
            [sprites[i].id]: sprite2Actions,
            [sprites[j].id]: sprite1Actions
          }));
        }
      }
    }
    return [...sprites];
  };

  useEffect(() => {
    if (isPlaying) {
      let lastTime = performance.now();
      
      const animate = (currentTime: number) => {
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        setSprites(prevSprites => {
          const updatedSprites = prevSprites.map(sprite => {
            if (!sprite.isAnimating) return sprite;

            const newX = sprite.x + sprite.velocityX * deltaTime;
            const newY = sprite.y + sprite.velocityY * deltaTime;
            const stageWidth = stageRef.current?.clientWidth ?? 600;
            const stageHeight = stageRef.current?.clientHeight ?? 600;
            
            // Bounce off walls
            let newVelocityX = sprite.velocityX;
            let newVelocityY = sprite.velocityY;
            
            if (newX <= 0 || newX >= stageWidth) {
              newVelocityX = -sprite.velocityX;
            }
            if (newY <= 0 || newY >= stageHeight) {
              newVelocityY = -sprite.velocityY;
            }

            return {
              ...sprite,
              x: Math.max(0, Math.min(newX, stageWidth)),
              y: Math.max(0, Math.min(newY, stageHeight)),
              velocityX: newVelocityX,
              velocityY: newVelocityY
            };
          });

          return handleCollisions(updatedSprites);
        });

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isPlaying, actionBlocks]);

  const deleteSprite = (id: string) => {
    setSprites(prev => prev.filter(sprite => sprite.id !== id));
    if (selectedSprite === id) {
      setSelectedSprite(null);
    }
  };

  const resetAll = () => {
    setSprites([]);
    setSelectedSprite(null);
    setIsPlaying(false);
    setActionBlocks({});
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      Object.entries(actionBlocks).forEach(([spriteId, actions]) => {
        actions.forEach((action, index) => {
          setTimeout(() => {
            setSprites(prev => prev.map(sprite => {
              if (sprite.id === spriteId) {
                let newX = sprite.x;
                let newY = sprite.y;
                let newSize = sprite.size;
                let newDirection = sprite.direction;
                let newSaying = sprite.saying;
                let newVelocityX = sprite.velocityX;
                let newVelocityY = sprite.velocityY;

                switch (action.type) {
                  case 'moveX':
                    newVelocityX = action.value;
                    break;
                  case 'moveY':
                    newVelocityY = action.value;
                    break;
                  case 'move':
                    const radians = (sprite.direction - 90) * Math.PI / 180;
                    newVelocityX = Math.cos(radians) * action.value;
                    newVelocityY = Math.sin(radians) * action.value;
                    break;
                  case 'turn':
                    newDirection = (sprite.direction + action.value) % 360;
                    break;
                  case 'size':
                    newSize = Math.max(0.1, sprite.size + action.value);
                    break;
                  case 'say':
                    newSaying = "Hello!";
                    break;
                  case 'random':
                    newX = Math.random() * 400 + 100;
                    newY = Math.random() * 400 + 100;
                    break;
                }

                return {
                  ...sprite,
                  x: newX,
                  y: newY,
                  size: newSize,
                  direction: newDirection,
                  saying: newSaying,
                  velocityX: newVelocityX,
                  velocityY: newVelocityY,
                  isAnimating: true
                };
              }
              return sprite;
            }));

            // Stop animation after the last action
            if (index === actions.length - 1) {
              setTimeout(() => {
                setSprites(prev => prev.map(sprite => 
                  sprite.id === spriteId 
                    ? { ...sprite, isAnimating: false, velocityX: 0, velocityY: 0 }
                    : sprite
                ));
              }, 1000);
            }
          }, index * 1000);
        });
      });
    }
  }, [isPlaying, actionBlocks]);

  const handleActionDragStart = (e: DragEvent<HTMLDivElement>, action: Partial<ActionBlock>) => {
    e.dataTransfer.setData('application/json', JSON.stringify(action));
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, spriteId: string) => {
    if (isPlaying) return;
    setIsDragging(true);
    setSelectedSprite(spriteId);
    e.dataTransfer.setData('text/plain', spriteId);
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const spriteId = e.dataTransfer.getData('text/plain');
    const stage = stageRef.current;
    
    if (stage) {
      const stageRect = stage.getBoundingClientRect();
      const x = e.clientX - stageRect.left;
      const y = e.clientY - stageRect.top;
      
      setSprites(prev => prev.map(sprite => 
        sprite.id === spriteId
          ? { ...sprite, x, y }
          : sprite
      ));
    }
    
    setIsDragging(false);
  };

  const handleActionDrop = (e: DragEvent<HTMLDivElement>, spriteId: string) => {
    e.preventDefault();
    try {
      const actionData = JSON.parse(e.dataTransfer.getData('application/json'));
      const newAction: ActionBlock = {
        id: `action-${Date.now()}`,
        type: actionData.type,
        value: actionData.value,
        duration: actionData.duration,
        x: actionData.x,
        y: actionData.y,
        repeat: actionData.repeat,
        label: actionData.label
      };

      setActionBlocks(prev => ({
        ...prev,
        [spriteId]: [...(prev[spriteId] || []), newAction]
      }));
    } catch (error) {
      console.error('Failed to parse action data:', error);
    }
  };

  const removeAction = (spriteId: string, actionId: string) => {
    setActionBlocks(prev => ({
      ...prev,
      [spriteId]: prev[spriteId].filter(action => action.id !== actionId)
    }));
  };

  const getSpriteIcon = (type: Sprite['type'], size: number, className: string) => {
    switch (type) {
      case 'cat':
        return (
          <img 
            src="https://quizizz.com/media/resource/gs/quizizz-media/quizzes/a16db854-0c67-4e98-9e27-590dd764bc38?w=200&h=200"
            alt="Cat"
            width={size * 2.5}
            height={size * 2.5}
            className={className}
            style={{ pointerEvents: 'none' }}
          />
        );
      case 'dog':
        return <Dog size={size} className={className} />;
      case 'ball':
        return <Circle size={size} className={className} />;
      case 'human':
        return <User size={size} className={className} />;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="bg-purple-600 text-white p-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-2xl font-bold">Scratch</div>
          <div className="flex space-x-2">
            <button className="p-2 hover:bg-purple-700 rounded-lg flex items-center gap-1">
              <Settings size={16} /> Settings
            </button>
            <button className="p-2 hover:bg-purple-700 rounded-lg flex items-center gap-1">
              <FileText size={16} /> File
            </button>
            <button className="p-2 hover:bg-purple-700 rounded-lg flex items-center gap-1">
              <Edit size={16} /> Edit
            </button>
            <button className="p-2 hover:bg-purple-700 rounded-lg flex items-center gap-1">
              <BookOpen size={16} /> Tutorials
            </button>
            <button className="p-2 hover:bg-purple-700 rounded-lg flex items-center gap-1">
              <Bug size={16} /> Debug
            </button>
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="bg-purple-700 px-4 py-1 rounded-lg hover:bg-purple-800">
            Join Scratch
          </button>
          <button className="bg-purple-700 px-4 py-1 rounded-lg hover:bg-purple-800">
            Sign in
          </button>
        </div>
      </nav>

      <div className="flex-1 p-4 bg-purple-50">
        <div className="flex gap-4 mb-4">
          <div className="flex gap-2">
            <button 
              onClick={() => addSprite('cat')}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
            >
              <Plus size={20} /> Cat
            </button>
            <button 
              onClick={() => addSprite('dog')}
              className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
            >
              <Plus size={20} /> Dog
            </button>
            <button 
              onClick={() => addSprite('ball')}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              <Plus size={20} /> Ball
            </button>
            <button 
              onClick={() => addSprite('human')}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              <Plus size={20} /> Human
            </button>
          </div>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            {isPlaying ? 'Stop' : 'Play'}
          </button>
          <button 
            onClick={resetAll}
            className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            <RotateCcw size={20} /> Reset All
          </button>
        </div>

        <div className="flex gap-4">
          <div className="flex gap-4 w-1/2">
            <div className="w-1/2 bg-purple-200 p-4 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Actions</h2>
              <div className="space-y-4">
                <div className="bg-purple-300 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Motion</h3>
                  <div 
                    draggable
                    onDragStart={(e) => handleActionDragStart(e, { type: 'moveX', value: 100, label: 'Move Right' })}
                    className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600 cursor-move"
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <ArrowRight size={20} /> Move Right
                    </div>
                  </div>
                  <div 
                    draggable
                    onDragStart={(e) => handleActionDragStart(e, { type: 'moveX', value: -100, label: 'Move Left' })}
                    className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600 cursor-move"
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <ArrowRight size={20} className="rotate-180" /> Move Left
                    </div>
                  </div>
                  <div 
                    draggable
                    onDragStart={(e) => handleActionDragStart(e, { type: 'moveY', value: 50, label: 'Move Down' })}
                    className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600 cursor-move"
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <ArrowDown size={20} /> Move Down
                    </div>
                  </div>
                  <div 
                    draggable
                    onDragStart={(e) => handleActionDragStart(e, { type: 'moveY', value: -50, label: 'Move Up' })}
                    className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600 cursor-move"
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <ArrowDown size={20} className="rotate-180" /> Move Up
                    </div>
                  </div>
                  <div 
                    draggable
                    onDragStart={(e) => handleActionDragStart(e, { type: 'turn', value: 90, label: 'Turn 90°' })}
                    className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600 cursor-move"
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <RotateCw size={20} /> Turn 90°
                    </div>
                  </div>
                  <div 
                    draggable
                    onDragStart={(e) => handleActionDragStart(e, { type: 'random', value: 0, label: 'Random Position' })}
                    className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600 cursor-move"
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <Random size={20} /> Random Position
                    </div>
                  </div>
                </div>

                <div className="bg-purple-300 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Looks</h3>
                  <div 
                    draggable
                    onDragStart={(e) => handleActionDragStart(e, { type: 'say', value: 0, duration: 2, label: 'Say Hello' })}
                    className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600 cursor-move"
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <MessageCircle size={20} /> Say Hello
                    </div>
                  </div>
                  <div 
                    draggable
                    onDragStart={(e) => handleActionDragStart(e, { type: 'size', value: 0.1, label: 'Increase Size' })}
                    className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600 cursor-move"
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <Maximize2 size={20} /> Increase Size
                    </div>
                  </div>
                  <div 
                    draggable
                    onDragStart={(e) => handleActionDragStart(e, { type: 'size', value: -0.1, label: 'Decrease Size' })}
                    className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600 cursor-move"
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <Minimize2 size={20} /> Decrease Size
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-1/2 bg-purple-200 p-4 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Action Flow</h2>
              <div className="space-y-4">
                {sprites.map((sprite, index) => (
                  <div 
                    key={sprite.id}
                    className="bg-purple-300 p-4 rounded-lg"
                  >
                    <h3 className="font-bold mb-2">Sprite {index + 1}</h3>
                    <div 
                      className="min-h-[100px] bg-purple-100 p-2 rounded-lg"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleActionDrop(e, sprite.id)}
                    >
                      {actionBlocks[sprite.id]?.map((action, actionIndex) => (
                        <div 
                          key={action.id}
                          className="bg-purple-500 text-white px-4 py-2 rounded mb-2 flex items-center justify-between"
                        >
                          <span>{action.label}</span>
                          <button
                            onClick={() => removeAction(sprite.id, action.id)}
                            className="text-white hover:text-red-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {(!actionBlocks[sprite.id] || actionBlocks[sprite.id].length === 0) && (
                        <div className="text-center text-gray-500 p-4">
                          Drop actions here
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div 
            ref={stageRef}
            className="w-1/2 bg-white p-4 rounded-lg relative" 
            style={{ height: '600px' }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {sprites.map(sprite => (
              <div
                key={sprite.id}
                className={`absolute cursor-move transition-transform group ${selectedSprite === sprite.id ? 'ring-2 ring-purple-500' : ''} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{
                  left: sprite.x,
                  top: sprite.y,
                  transform: `rotate(${sprite.direction}deg) scale(${sprite.size})`,
                }}
                onClick={() => setSelectedSprite(sprite.id)}
                draggable={!isPlaying}
                onDragStart={(e) => handleDragStart(e, sprite.id)}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
              >
                {getSpriteIcon(sprite.type, 48, `${
                  sprite.type === 'cat' ? 'text-orange-500' :
                  sprite.type === 'dog' ? 'text-brown-500' :
                  sprite.type === 'ball' ? 'text-red-500' :
                  'text-blue-500'
                }`)}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSprite(sprite.id);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
                {sprite.saying && (
                  <div className="absolute top-0 left-full ml-2 bg-white p-2 rounded-lg shadow">
                    {sprite.saying}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;