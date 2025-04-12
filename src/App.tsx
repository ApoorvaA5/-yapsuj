import React, { useState, useRef, useEffect } from 'react';
import { Cat, Dog, Circle, User, Plus, Play, Pause, Trash2, RotateCcw, ArrowRight, ArrowDown, RotateCw, Move, Command as Random, MessageCircle, Maximize2, Minimize2, Repeat, Settings, FileText, Edit, BookOpen, Bug, Volume2, Shirt } from 'lucide-react';

// Keep all interfaces the same
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
}

interface Animation {
  type: 'move' | 'turn' | 'goto' | 'say' | 'think' | 'moveX' | 'moveY' | 'size' | 'random';
  value: number;
  duration?: number;
  x?: number;
  y?: number;
  repeat?: number;
}

function App() {
  // Keep all state and functions the same until the return statement
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const [selectedSprite, setSelectedSprite] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationFrameRef = useRef<number>();

  // Keep all functions the same (addSprite, deleteSprite, resetAll, addAnimation, getSpriteIcon, animate)
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
      size: 1
    };
    setSprites(prev => [...prev, newSprite]);
    setSelectedSprite(newSprite.id);
  };

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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const addAnimation = (type: Animation['type'], value: number, duration?: number, x?: number, y?: number, repeat?: number) => {
    if (!selectedSprite) return;
    
    const animation: Animation = { type, value, duration, x, y, repeat };
    
    setSprites(prev => prev.map(sprite => {
      if (sprite.id === selectedSprite) {
        return {
          ...sprite,
          animation: [...sprite.animation, animation]
        };
      }
      return sprite;
    }));
  };

  const getSpriteIcon = (type: Sprite['type'], size: number, className: string) => {
    switch (type) {
      case 'cat':
        return (
          <img 
            src="https://quizizz.com/media/resource/gs/quizizz-media/quizzes/a16db854-0c67-4e98-9e27-590dd764bc38?w=200&h=200"
            alt="Cat"
            width={size * 4}
            height={size * 4}
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
  
  const animate = (time: number) => {
    setSprites(prev => prev.map(sprite => {
      if (sprite.animation.length === 0) return sprite;

      const currentAnimation = sprite.animation[0];
      let newX = sprite.x;
      let newY = sprite.y;
      let newDirection = sprite.direction;
      let newSize = sprite.size;
      let newAnimation = [...sprite.animation];
      let newSaying = sprite.saying;

      switch (currentAnimation.type) {
        case 'move':
          const radians = (sprite.direction - 90) * Math.PI / 180;
          newX += Math.cos(radians) * currentAnimation.value / 10;
          newY += Math.sin(radians) * currentAnimation.value / 10;
          break;
        case 'moveX':
          newX += currentAnimation.value / 10;
          newAnimation = newAnimation.slice(1);
          break;
        case 'moveY':
          newY += currentAnimation.value / 10;
          newAnimation = newAnimation.slice(1);
          break;
        case 'turn':
          newDirection = (sprite.direction + currentAnimation.value) % 360;
          newAnimation = newAnimation.slice(1);
          break;
        case 'goto':
          if (currentAnimation.x !== undefined && currentAnimation.y !== undefined) {
            newX = currentAnimation.x;
            newY = currentAnimation.y;
            newAnimation = newAnimation.slice(1);
          }
          break;
        case 'random':
          newX = Math.random() * 400 + 100;
          newY = Math.random() * 400 + 100;
          newAnimation = newAnimation.slice(1);
          break;
        case 'size':
          newSize = Math.max(0.1, sprite.size + currentAnimation.value);
          newAnimation = newAnimation.slice(1);
          break;
        case 'say':
          newSaying = "Hello!";
          if (currentAnimation.duration) {
            setTimeout(() => {
              setSprites(prev => prev.map(s => 
                s.id === sprite.id ? { ...s, saying: '' } : s
              ));
            }, currentAnimation.duration * 1000);
          }
          newAnimation = newAnimation.slice(1);
          break;
      }

      prev.forEach(otherSprite => {
        if (otherSprite.id !== sprite.id) {
          const dx = newX - otherSprite.x;
          const dy = newY - otherSprite.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 50) {
            const temp = sprite.animation;
            newAnimation = otherSprite.animation;
            setSprites(prev => prev.map(s => 
              s.id === otherSprite.id 
                ? { ...s, animation: temp }
                : s
            ));
          }
        }
      });

      if (currentAnimation.repeat && currentAnimation.repeat > 1) {
        newAnimation = [
          { ...currentAnimation, repeat: currentAnimation.repeat - 1 },
          ...newAnimation.slice(1)
        ];
      }

      return {
        ...sprite,
        x: newX,
        y: newY,
        direction: newDirection,
        size: newSize,
        saying: newSaying,
        animation: newAnimation
      };
    }));

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

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

      <div className="bg-purple-100 p-2 flex items-center space-x-4 border-b border-purple-200">
        <button className="p-2 hover:bg-purple-200 rounded-lg flex items-center gap-1">
          <FileText size={16} /> Code
        </button>
        <button className="p-2 hover:bg-purple-200 rounded-lg flex items-center gap-1">
          <Shirt size={16} /> Costumes
        </button>
        <button className="p-2 hover:bg-purple-200 rounded-lg flex items-center gap-1">
          <Volume2 size={16} /> Sounds
        </button>
      </div>

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
              className="flex items-center gap-2 bg-brown-500 text-white px-4 py-2 rounded-lg hover:bg-brown-600"
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
          <div className="w-1/4 bg-purple-200 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Actions</h2>
            
            <div className="space-y-4">
              <div className="bg-purple-300 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Motion</h3>
                <button 
                  onClick={() => addAnimation('moveX', 50)}
                  className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <ArrowRight size={20} /> Move X by 50
                  </div>
                </button>
                <button 
                  onClick={() => addAnimation('moveY', 50)}
                  className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <ArrowDown size={20} /> Move Y by 50
                  </div>
                </button>
                <button 
                  onClick={() => addAnimation('turn', 360)}
                  className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <RotateCw size={20} /> Rotate 360
                  </div>
                </button>
                <button 
                  onClick={() => addAnimation('goto', 0, undefined, 200, 200)}
                  className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <Move size={20} /> Go to (0,0)
                  </div>
                </button>
                <button 
                  onClick={() => {
                    addAnimation('moveX', -50);
                    addAnimation('moveY', -50);
                  }}
                  className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600"
                >
                  Move X=-50 Y=-50
                </button>
                <button 
                  onClick={() => addAnimation('random', 0)}
                  className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <Random size={20} /> Go to random position
                  </div>
                </button>
              </div>

              <div className="bg-purple-300 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Looks</h3>
                <button 
                  onClick={() => addAnimation('say', 0)}
                  className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <MessageCircle size={20} /> Say Hello
                  </div>
                </button>
                <button 
                  onClick={() => addAnimation('say', 0, 1)}
                  className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600"
                >
                  Say Hello For 1 sec
                </button>
                <button 
                  onClick={() => addAnimation('size', 0.1)}
                  className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <Maximize2 size={20} /> Increase Size
                  </div>
                </button>
                <button 
                  onClick={() => addAnimation('size', -0.1)}
                  className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <Minimize2 size={20} /> Decrease Size
                  </div>
                </button>
              </div>

              <div className="bg-purple-300 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Control</h3>
                <button 
                  onClick={() => addAnimation('move', 100, undefined, undefined, undefined, 10)}
                  className="block w-full bg-purple-500 text-white px-4 py-2 rounded mb-2 hover:bg-purple-600"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <Repeat size={20} /> Repeat 10 times
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="w-1/2 bg-white p-4 rounded-lg relative" style={{ height: '600px' }}>
            {sprites.map(sprite => (
              <div
                key={sprite.id}
                className={`absolute cursor-pointer transition-transform group ${selectedSprite === sprite.id ? 'ring-2 ring-purple-500' : ''}`}
                style={{
                  left: sprite.x,
                  top: sprite.y,
                  transform: `rotate(${sprite.direction}deg) scale(${sprite.size})`,
                }}
                onClick={() => setSelectedSprite(sprite.id)}
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
                {sprite.thinking && (
                  <div className="absolute top-0 left-full ml-2 bg-white p-2 rounded-lg shadow">
                    💭 {sprite.thinking}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="w-1/4 bg-purple-200 p-4 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Sprites</h2>
            <div className="space-y-2">
              {sprites.map((sprite, index) => (
                <div 
                  key={sprite.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
                    selectedSprite === sprite.id ? 'bg-purple-300' : 'bg-purple-100 hover:bg-purple-200'
                  }`}
                  onClick={() => setSelectedSprite(sprite.id)}
                >
                  <div className="w-8 h-8 flex items-center justify-center">
                    {getSpriteIcon(sprite.type, 24, `${
                      sprite.type === 'cat' ? 'text-orange-500' :
                      sprite.type === 'dog' ? 'text-brown-500' :
                      sprite.type === 'ball' ? 'text-red-500' :
                      'text-blue-500'
                    }`)}
                  </div>
                  <span className="flex-1">Sprite {index + 1}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSprite(sprite.id);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {sprites.length === 0 && (
                <div className="text-center text-gray-500 p-4">
                  No sprites added yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;