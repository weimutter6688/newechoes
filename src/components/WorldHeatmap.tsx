import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import worldData from '@/assets/world.zh.json';
import chinaData from '@/assets/china.json';

interface WorldHeatmapProps {
  visitedPlaces: string[];
}

const WorldHeatmap: React.FC<WorldHeatmapProps> = ({ visitedPlaces }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    labelRenderer: CSS2DRenderer;
    controls: OrbitControls;
    earth: THREE.Mesh;
    bgSphere: THREE.Mesh;
    countries: Map<string, THREE.Object3D>;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    animationId: number | null;
    lastCameraPosition: THREE.Vector3 | null;
    lastMouseEvent: MouseEvent | null;
    lastClickedCountry: string | null;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 清理之前的场景
    if (sceneRef.current) {
      if (sceneRef.current.animationId !== null) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
      sceneRef.current.renderer.dispose();
      sceneRef.current.labelRenderer.domElement.remove();
      sceneRef.current.scene.clear();
      containerRef.current.innerHTML = '';
    }

    // 检查当前是否为暗色模式
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // 根据当前模式设置颜色
    const getColors = () => {
      return {
        background: 'transparent', // 改为透明背景
        earthBase: isDarkMode ? '#1f2937' : '#e5e7eb',
        visited: isDarkMode ? '#059669' : '#10b981',
        highlight: isDarkMode ? '#f59e0b' : '#f59e0b',
        border: isDarkMode ? '#4b5563' : '#9ca3af',
        visitedBorder: isDarkMode ? '#059669' : '#10b981',
        chinaBorder: isDarkMode ? '#ef4444' : '#ef4444', // 中国边界使用红色
        text: isDarkMode ? '#ffffff' : '#374151',
        bgSphere: isDarkMode ? '#111827' : '#f3f4f6', // 背景球体颜色
      };
    };
    
    const colors = getColors();

    // 创建场景
    const scene = new THREE.Scene();
    // 将背景设置为透明
    scene.background = null;

    // 创建不透明材质的辅助函数
    const createOpaqueMaterial = (color: string, side: THREE.Side = THREE.FrontSide, renderOrder: number = 0) => {
      const material = new THREE.MeshBasicMaterial({
        color: color,
        side: side,
        transparent: false,
        opacity: 1.0,
        depthTest: true,
        depthWrite: true
      });
      return material;
    };

    // 创建地球前，先创建一个背景球体 - 设置为对应主题的背景色
    const bgSphereGeometry = new THREE.SphereGeometry(2.1, 64, 64);
    const bgSphereMaterial = createOpaqueMaterial(colors.bgSphere, THREE.BackSide);
    const bgSphere = new THREE.Mesh(bgSphereGeometry, bgSphereMaterial);
    bgSphere.renderOrder = 0;
    scene.add(bgSphere);
    
    // 创建一个中间层球体，防止看透 - 设置为对应主题的背景色
    const midSphereGeometry = new THREE.SphereGeometry(2.0, 64, 64);
    const midSphereMaterial = createOpaqueMaterial(colors.bgSphere);
    const midSphere = new THREE.Mesh(midSphereGeometry, midSphereMaterial);
    midSphere.renderOrder = 1;
    scene.add(midSphere);
    
    // 在地球内部添加一个实心球体 - 设置为对应主题的背景色
    const innerSphereGeometry = new THREE.SphereGeometry(1.97, 32, 32);
    const innerSphereMaterial = createOpaqueMaterial(colors.bgSphere);
    const innerSphere = new THREE.Mesh(innerSphereGeometry, innerSphereMaterial);
    innerSphere.renderOrder = 1.5;
    scene.add(innerSphere);
    
    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      45, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.z = 8;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true, // 启用alpha通道
      logarithmicDepthBuffer: true, 
      preserveDrawingBuffer: true,
      precision: "highp"
    });
    renderer.sortObjects = true; 
    // 设置透明背景
    renderer.setClearColor(0x000000, 0); 
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // 创建CSS2D渲染器用于标签
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    containerRef.current.appendChild(labelRenderer.domElement);

    // 添加控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.minDistance = 5;
    controls.maxDistance = 15;
    
    // 限制上下旋转角度，避免相机翻转
    controls.minPolarAngle = Math.PI * 0.1;
    controls.maxPolarAngle = Math.PI * 0.9;
    
    // 添加控制器事件监听
    controls.addEventListener('change', () => {
      if (sceneRef.current) {
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
      }
    });

    // 创建地球几何体，注意减小尺寸防止Z-fighting
    const earthGeometry = new THREE.SphereGeometry(1.95, 64, 64);
    
    // 使用不透明的基础材质
    const earthMaterial = createOpaqueMaterial(colors.earthBase, THREE.FrontSide);
    
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.matrixAutoUpdate = false;
    earth.updateMatrix();
    earth.renderOrder = 2;
    scene.add(earth);

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // 创建国家边界
    const countries = new Map<string, THREE.Object3D>();
    const countryGroup = new THREE.Group();
    earth.add(countryGroup);
    
    // 创建一个辅助函数，用于将经纬度转换为三维坐标
    const latLongToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
      // 调整经度范围，确保它在[-180, 180]之间
      while (lon > 180) lon -= 360;
      while (lon < -180) lon += 360;
      
      const phi = (90 - lat) * Math.PI / 180;
      const theta = (lon + 180) * Math.PI / 180;
      
      const x = -radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      return new THREE.Vector3(x, y, z);
    };
    
    // 省份边界和中心点数据结构
    const provinceBoundaries = new Map<string, THREE.Vector3[][]>();
    const provinceCenters = new Map<string, THREE.Vector3>();

    // 创建一个通用函数，用于处理地理特性（国家或省份）
    const processGeoFeature = (
      feature: any, 
      parent: THREE.Group, 
      options: {
        regionType: 'country' | 'province',
        parentName?: string,
        scale?: number,
        borderColor?: string,
        visitedBorderColor?: string
      }
    ) => {
      const { regionType, parentName, scale = 2.01, borderColor, visitedBorderColor } = options;
      
      const regionName = regionType === 'province' && parentName 
        ? `${parentName}-${feature.properties.name}` 
        : feature.properties.name;
      
      const isRegionVisited = visitedPlaces.includes(regionName);
      
      // 为每个地区创建一个组
      const regionObject = new THREE.Group();
      regionObject.userData = { name: regionName, isVisited: isRegionVisited };
      
      // 计算地区中心点
      let centerLon = 0;
      let centerLat = 0;
      let pointCount = 0;
      let largestPolygonArea = 0;
      let largestPolygonCenter = { lon: 0, lat: 0 };
      
      // 首先检查GeoJSON特性中是否有预定义的中心点
      let hasPreDefinedCenter = false;
      let centerVector;
      
      if (feature.properties.cp && Array.isArray(feature.properties.cp) && feature.properties.cp.length === 2) {
        const [cpLon, cpLat] = feature.properties.cp;
        hasPreDefinedCenter = true;
        centerVector = latLongToVector3(cpLat, cpLon, scale + 0.005);
        centerLon = cpLon;
        centerLat = cpLat;
        
        // 保存预定义中心点
        provinceCenters.set(regionName, centerVector);
      }
      
      // 存储区域边界
      const boundaries: THREE.Vector3[][] = [];
      
      // 计算多边形面积的辅助函数
      const calculatePolygonArea = (coords: number[][]) => {
        let area = 0;
        for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
          area += coords[i][0] * coords[j][1];
          area -= coords[i][1] * coords[j][0];
        }
        return Math.abs(area / 2);
      };
      
      // 处理多边形坐标
      const processPolygon = (polygonCoords: any) => {
        const points: THREE.Vector3[] = [];
        
        // 收集多边形的点
        polygonCoords.forEach((point: number[]) => {
          const lon = point[0];
          const lat = point[1];
          centerLon += lon;
          centerLat += lat;
          pointCount++;
          
          // 使用辅助函数将经纬度转换为3D坐标
          points.push(latLongToVector3(lat, lon, scale));
        });
        
        // 计算当前多边形的面积和中心
        if (regionType === 'country') {
          const area = calculatePolygonArea(polygonCoords);
          if (area > largestPolygonArea) {
            largestPolygonArea = area;
            
            // 计算多边形中心
            let polyLon = 0;
            let polyLat = 0;
            polygonCoords.forEach((point: number[]) => {
              polyLon += point[0];
              polyLat += point[1];
            });
            
            largestPolygonCenter = {
              lon: polyLon / polygonCoords.length,
              lat: polyLat / polygonCoords.length
            };
          }
        }
        
        // 保存边界多边形
        if (points.length > 2) {
          boundaries.push(points);
        }
        
        // 创建边界线
        if (points.length > 1) {
          const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
          const lineMaterial = new THREE.LineBasicMaterial({ 
            color: isRegionVisited 
              ? (visitedBorderColor || colors.visitedBorder) 
              : (borderColor || colors.border),
            linewidth: isRegionVisited ? 1.5 : 1,
            transparent: true,
            opacity: isRegionVisited ? 0.9 : 0.7,
            depthTest: false, // 禁用深度测试，解决Z-fighting问题
            polygonOffset: true,  // 启用多边形偏移
            polygonOffsetFactor: isRegionVisited ? -2 : -1, // 已访问区域的边界线偏移更多，确保在上层
            polygonOffsetUnits: 1
          });
          
          const line = new THREE.Line(lineGeometry, lineMaterial);
          line.userData = { 
            name: regionName, 
            isVisited: isRegionVisited,
            originalColor: isRegionVisited 
              ? (visitedBorderColor || colors.visitedBorder) 
              : (borderColor || colors.border)
          };
          // 设置已访问区域的边界线渲染顺序更高，确保它们始终绘制在未访问区域边界线的上方
          line.renderOrder = isRegionVisited ? 3 : 2;
          regionObject.add(line);
          
          // 如果是已访问的地区，为这个边界创建一个填充面
          if (isRegionVisited && points.length >= 3) {
            try {
              // 使用ShapeGeometry创建一个平面填充
              // 首先创建一个2D平面上的形状
              const center = new THREE.Vector3(0, 0, 0);
              // 将3D点投影到以该点为中心的平面上
              const projectedPoints = points.map(p => {
                // 计算从地球中心到点的方向向量
                const dir = p.clone().normalize();
                // 计算投影平面的法向量（就是该点的方向）
                const normal = dir.clone();
                // 创建一个与地球表面近似切线的平面
                const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, p);
                
                // 计算从中心到各点的投影坐标
                const v1 = new THREE.Vector3();
                const v2 = new THREE.Vector3();
                
                // 获取平面上的两个相互垂直的方向作为UV坐标系
                let u = new THREE.Vector3(1, 0, 0);
                if (Math.abs(normal.dot(u)) > 0.9) {
                  u = new THREE.Vector3(0, 1, 0);
                }
                const v = new THREE.Vector3().crossVectors(normal, u).normalize();
                u = new THREE.Vector3().crossVectors(v, normal).normalize();
                
                // 计算点在该平面上的UV坐标
                const projected = p.clone().sub(center);
                v1.set(projected.dot(u), projected.dot(v), 0);
                return v1;
              });
              
              // 创建一个Shape对象
              const shape = new THREE.Shape();
              
              // 移动到第一个点
              shape.moveTo(projectedPoints[0].x, projectedPoints[0].y);
              
              // 连接所有其他点
              for (let i = 1; i < projectedPoints.length; i++) {
                shape.lineTo(projectedPoints[i].x, projectedPoints[i].y);
              }
              
              // 关闭形状
              shape.closePath();
              
              // 创建一个面材质
              const faceMaterial = new THREE.MeshBasicMaterial({
                color: colors.visited,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
                depthWrite: false
              });
              
              // 根据中心点确定方向
              const centerPoint = points.reduce((acc, point) => acc.add(point), new THREE.Vector3()).multiplyScalar(1 / points.length);
              const direction = centerPoint.clone().normalize();
              
              // 根据曲面方向创建网格
              const geometry = new THREE.ShapeGeometry(shape);
              const mesh = new THREE.Mesh(geometry, faceMaterial);
              
              // 放置并旋转网格以匹配多边形位置
              mesh.position.copy(centerPoint);
              mesh.lookAt(center);
              
              // 设置网格属性
              mesh.userData = { 
                name: regionName, 
                isVisited: isRegionVisited,
                originalColor: colors.visited
              };
              mesh.renderOrder = 1;
              
              // 添加到区域对象
              regionObject.add(mesh);
            } catch (error) {
              console.error("填充区域时出错:", error);
              // 如果填充区域出错，回退到简单的圆盘标记
              const centerPoint = points.reduce((acc, point) => acc.add(point), new THREE.Vector3()).multiplyScalar(1 / points.length);
              const diskGeometry = new THREE.CircleGeometry(0.1, 32);
              const diskMaterial = new THREE.MeshBasicMaterial({
                color: colors.visited,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
              });
              
              const disk = new THREE.Mesh(diskGeometry, diskMaterial);
              disk.position.copy(centerPoint);
              disk.lookAt(0, 0, 0);
              disk.rotateX(Math.PI / 2);
              disk.userData = { name: regionName, isVisited: true };
              disk.renderOrder = 1;
              regionObject.add(disk);
            }
          }
        }
      };
      
      // 处理不同类型的几何体
      if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
        if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates.forEach((ring: any) => {
            processPolygon(ring);
          });
        } else if (feature.geometry.type === 'MultiPolygon') {
          feature.geometry.coordinates.forEach((polygon: any) => {
            polygon.forEach((ring: any) => {
              processPolygon(ring);
            });
          });
        }
        
        // 保存省份边界
        if (regionType === 'province' && boundaries.length > 0) {
          provinceBoundaries.set(regionName, boundaries);
        }
        
        if (pointCount > 0 && !hasPreDefinedCenter) {
          // 如果是国家且有最大多边形
          if (regionType === 'country' && largestPolygonArea > 0) {
            centerLon = largestPolygonCenter.lon;
            centerLat = largestPolygonCenter.lat;
          } else {
            // 回退到平均中心点
            centerLon /= pointCount;
            centerLat /= pointCount;
          }
          
          // 将中心点经纬度转换为3D坐标
          centerVector = latLongToVector3(centerLat, centerLon, scale + 0.005);
          
          // 保存计算的中心点
          if (regionType === 'province') {
            provinceCenters.set(regionName, centerVector);
          }
        }
        
        if (pointCount > 0) {
          // 添加地区对象到父组
          parent.add(regionObject);
          countries.set(regionName, regionObject);
        }
      }
      
      return regionObject;
    };

    // 处理世界GeoJSON数据
    worldData.features.forEach((feature: any) => {
      const countryName = feature.properties.name;
      
      // 跳过中国，因为我们将使用更详细的中国地图数据
      if (countryName === '中国') return;
      
      processGeoFeature(feature, countryGroup, {
        regionType: 'country',
        scale: 2.01
      });
    });
    
    // 处理中国的省份
    const chinaObject = new THREE.Group();
    chinaObject.userData = { name: '中国', isVisited: visitedPlaces.includes('中国') };
    
    chinaData.features.forEach((feature: any) => {
      processGeoFeature(feature, chinaObject, {
        regionType: 'province',
        parentName: '中国',
        scale: 2.015,
        borderColor: colors.chinaBorder,
        visitedBorderColor: colors.visitedBorder
      });
    });

    // 添加中国对象到国家组
    countryGroup.add(chinaObject);
    countries.set('中国', chinaObject);
    
    // 创建射线投射器用于鼠标交互
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // 添加节流函数，限制鼠标移动事件的触发频率
    const throttle = (func: Function, limit: number) => {
      let inThrottle: boolean = false;
      return function(this: any, ...args: any[]) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    };

    // 计算鼠标射线和检测交互的通用函数
    const calculateMouseRay = (event: MouseEvent) => {
      if (!containerRef.current || !sceneRef.current) return null;
      
      // 计算鼠标在画布中的归一化坐标
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // 应用坐标，确保值在合理范围内
      mouse.x = Math.max(-1, Math.min(1, x));
      mouse.y = Math.max(-1, Math.min(1, y));
      
      // 设置射线投射器的精度
      raycaster.params.Line = { threshold: 0.2 };
      raycaster.setFromCamera(mouse, sceneRef.current.camera);
      
      return raycaster;
    };
    
    // 通用函数，查找与射线相交的国家
    const findIntersectedCountry = () => {
      if (!sceneRef.current) return null;
      
      // 首先检测是否与地球相交
      const sphereCenter = new THREE.Vector3(0, 0, 0);
      const sphereRadius = 2; // 地球半径
      const sphere = new THREE.Sphere(sphereCenter, sphereRadius);
      
      // 检测射线与球体是否相交，并获取交点
      const earthIntersectionPoint = new THREE.Vector3();
      const hasEarthIntersection = raycaster.ray.intersectSphere(sphere, earthIntersectionPoint);
      
      // 如果射线没有与地球相交，返回null
      if (!hasEarthIntersection) return null;
      
      // 计算射线与地球交点的距离
      const distanceToEarthIntersection = earthIntersectionPoint.distanceTo(sceneRef.current.camera.position);
      
      // 检测与国家组的交叉
      let intersects = raycaster.intersectObject(countryGroup, true);
      
      // 过滤出只在地球前表面的交点
      const tolerance = 0.1;
      intersects = intersects.filter(intersect => {
        return intersect.distance <= (distanceToEarthIntersection + tolerance);
      });
      
      if (intersects.length === 0) return null;
      
      // 寻找相交的国家
      // 先尝试找到面对象（Mesh类型）
      for (const intersect of intersects) {
        if (intersect.object instanceof THREE.Mesh && 
            intersect.object.userData && 
            intersect.object.userData.name) {
          return intersect.object.userData.name;
        }
      }
      
      // 如果没有找到面对象，尝试查找线对象
      for (const intersect of intersects) {
        let countryObject = intersect.object;
        
        // 如果对象本身有userData，优先使用
        if (countryObject.userData && countryObject.userData.name) {
          return countryObject.userData.name;
        } 
        
        // 向上遍历对象层次结构，找到有userData的父对象
        while (countryObject.parent) {
          countryObject = countryObject.parent as THREE.Object3D;
          if (countryObject.userData && countryObject.userData.name) {
            return countryObject.userData.name;
          }
          // 如果已经到达地球对象，则停止遍历
          if (countryObject === earth) break;
        }
      }
      
      return null;
    };

    // 鼠标移动事件 - 使用节流函数包装
    const onMouseMove = throttle((event: MouseEvent) => {
      if (!containerRef.current || !sceneRef.current) return;
      
      // 如果是通过点击选中的国家，不要通过移动鼠标改变它
      if (sceneRef.current.lastClickedCountry !== null) return;
      
      // 保存最后的鼠标事件，用于相机变化时重新检测
      sceneRef.current.lastMouseEvent = event;
      
      // 计算射线
      calculateMouseRay(event);
      
      // 查找相交的国家
      const countryName = findIntersectedCountry();
      
      if (countryName) {
        setHoveredCountry(countryName);
        controls.autoRotate = false;
      } else {
        setHoveredCountry(null);
        controls.autoRotate = true;
      }
    }, 60); // 60毫秒的节流时间

    // 添加清除选择的函数
    const clearSelection = () => {
      setHoveredCountry(null);
      if (sceneRef.current) {
        sceneRef.current.lastClickedCountry = null;
      }
      controls.autoRotate = true;
    };

    // 添加鼠标点击事件处理
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current || !sceneRef.current) return;
      
      // 计算射线
      calculateMouseRay(event);
      
      // 查找相交的国家
      const countryName = findIntersectedCountry();
      
      if (countryName) {
        setHoveredCountry(countryName);
        controls.autoRotate = false;
        sceneRef.current.lastClickedCountry = countryName;
      } else {
        clearSelection();
      }
    };

    // 添加鼠标双击事件处理
    const onDoubleClick = () => {
      clearSelection();
    };

    containerRef.current.addEventListener('mousemove', onMouseMove);
    containerRef.current.addEventListener('click', onClick);
    containerRef.current.addEventListener('dblclick', onDoubleClick);

    // 创建一个辅助函数，强制所有球体使用完全不透明的材质
    const enforceOpaqueMaterials = () => {
      // 修复地球材质
      if (earth && earth.material) {
        const mat = earth.material as THREE.MeshBasicMaterial;
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.depthTest = true;
        mat.depthWrite = true;
        mat.side = THREE.FrontSide;
        mat.needsUpdate = true;
      }
      
      // 修复所有背景球体材质
      [bgSphere, midSphere, innerSphere].forEach(sphere => {
        if (sphere && sphere.material instanceof THREE.MeshBasicMaterial) {
          sphere.material.transparent = false;
          sphere.material.opacity = 1.0;
          sphere.material.depthTest = true;
          sphere.material.depthWrite = true;
          sphere.material.needsUpdate = true;
        }
      });
    };
    
    // 应用一次以确保初始状态正确
    enforceOpaqueMaterials();

    // 动画循环
    const animate = () => {
      if (!sceneRef.current) return;
      
      // 获取当前帧计数
      const frameCount = sceneRef.current.animationId || 0;
      
      // 每5帧检查一次材质状态
      if (frameCount % 5 === 0) { 
        // 使用统一函数更新材质状态 - 仅处理球体
        [bgSphere, midSphere, innerSphere, earth].forEach(sphere => {
          if (sphere && sphere.material instanceof THREE.MeshBasicMaterial) {
            sphere.material.transparent = false;
            sphere.material.opacity = 1.0;
            sphere.material.depthTest = true;
            sphere.material.depthWrite = true;
            sphere.material.needsUpdate = true;
          }
        });
      }
      
      // 更新控制器
      sceneRef.current.controls.update();
      
      // 相机变化检测
      const cameraPosition = sceneRef.current.camera.position.clone();
      let cameraChanged = false;
      
      if (sceneRef.current.lastCameraPosition) {
        const distance = cameraPosition.distanceTo(sceneRef.current.lastCameraPosition);
        cameraChanged = distance > 0.35;
      }
      
      // 只有当相机移动且有最后鼠标事件时，才重新触发鼠标事件
      if (cameraChanged && sceneRef.current.lastMouseEvent && !sceneRef.current.lastClickedCountry) {
        onMouseMove(sceneRef.current.lastMouseEvent);
        
        // 确保已访问区域的边界线始终在未访问区域之上
        sceneRef.current.countries.forEach((object) => {
          object.traverse((child) => {
            if (child instanceof THREE.Line) {
              const childIsVisited = child.userData?.isVisited === true;
              if (childIsVisited) {
                child.renderOrder = 3;
                
                if (child.material instanceof THREE.LineBasicMaterial) {
                  child.material.depthTest = false;
                  child.material.polygonOffset = true;
                  child.material.polygonOffsetFactor = -2;
                  child.material.polygonOffsetUnits = 1;
                  child.material.needsUpdate = true;
                }
              }
            }
          });
        });
      }
      
      // 降低相机位置保存频率
      if (frameCount % 20 === 0) {
        sceneRef.current.lastCameraPosition = cameraPosition.clone();
      }
      
      // 渲染
      sceneRef.current.renderer.render(scene, camera);
      sceneRef.current.labelRenderer.render(scene, camera);
      
      // 请求下一帧
      sceneRef.current.animationId = requestAnimationFrame(animate);
    };

    // 覆盖渲染器的render方法，确保每次渲染前重设材质状态
    const originalRender = renderer.render;
    renderer.render = function(scene, camera) {
      // 在渲染前仅对球体对象强制更新材质状态
      [bgSphere, midSphere, innerSphere, earth].forEach(sphere => {
        if (sphere && sphere.material instanceof THREE.MeshBasicMaterial) {
          sphere.material.transparent = false;
          sphere.material.opacity = 1.0;
          sphere.material.needsUpdate = true;
        }
      });
      
      // 调用原始渲染方法
      originalRender.call(this, scene, camera);
    };

    // 保存场景引用，添加中间层球体引用
    sceneRef.current = {
      scene,
      camera,
      renderer,
      labelRenderer,
      controls,
      earth,
      bgSphere,
      countries,
      raycaster,
      mouse,
      animationId: null,
      lastCameraPosition: null,
      lastMouseEvent: null,
      lastClickedCountry: null
    };

    // 将视图旋转到中国位置
    const positionCameraToFaceChina = () => {
      // 中国的中心点经纬度
      const centerLon = 104.195397;
      const centerLat = 35.86166;
      
      // 检查是否为小屏幕
      const isSmallScreen = containerRef.current && containerRef.current.clientWidth < 640;
      
      // 根据屏幕大小设置不同的相机初始位置
      let fixedPosition;
      if (isSmallScreen) {
        // 小屏幕显示距离更远，以便看到更多地球
        fixedPosition = new THREE.Vector3(-2.10, 3.41, -7.5);
      } else {
        // 大屏幕使用原来的位置
        fixedPosition = new THREE.Vector3(-2.10, 3.41, -6.08);
      }
      
      // 应用位置
      camera.position.copy(fixedPosition);
      camera.lookAt(0, 0, 0);
      controls.update();
      
      // 禁用自动旋转一段时间
      controls.autoRotate = false;
      
      // 保存相机位置
      const chinaCameraInitialPosition = camera.position.clone();
      
      // 3秒后恢复旋转
      setTimeout(() => {
        if (sceneRef.current) {
          sceneRef.current.controls.autoRotate = true;
        }
      }, 3000);
      
      // 渲染
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
      
      // 将初始相机位置保存在sceneRef中
      if (sceneRef.current) {
        sceneRef.current.lastCameraPosition = chinaCameraInitialPosition;
      }
    };

    // 应用初始相机位置
    positionCameraToFaceChina();

    // 确保已访问区域的边界线优先显示
    setTimeout(() => {
      ensureVisitedBordersOnTop();
    }, 100);  // 稍微延迟确保所有元素都已创建完成

    // 开始动画
    sceneRef.current.animationId = requestAnimationFrame(animate);

    // 处理窗口大小变化
    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      
      const { camera, renderer, labelRenderer } = sceneRef.current;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      labelRenderer.setSize(width, height);
      
      // 在调整大小后立即渲染一次，以防止闪烁或偏移
      renderer.render(sceneRef.current.scene, camera);
      labelRenderer.render(sceneRef.current.scene, camera);
      
      // 确保已访问区域的边界线总是显示在顶层
      ensureVisitedBordersOnTop();
    };

    window.addEventListener('resize', handleResize);

    // 监听暗色模式变化
    const darkModeObserver = new MutationObserver(() => {
      if (!sceneRef.current) return;
      
      const isDark = document.documentElement.classList.contains('dark');
      const newColors = getColors();
      
      // 保持场景背景透明
      sceneRef.current.scene.background = null;
      
      // 设置透明背景
      sceneRef.current.renderer.setClearColor(0x000000, 0);
      
      // 更新材质颜色函数
      const updateMeshColor = (obj: THREE.Object3D, color: string) => {
        if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshBasicMaterial) {
          obj.material.color.set(color);
          obj.material.transparent = false;
          obj.material.opacity = 1.0;
          obj.material.needsUpdate = true;
        }
      };
      
      // 更新背景相关球体颜色
      const bgColor = newColors.bgSphere;
      
      // 直接更新三个球体对象，而不是遍历整个场景
      [bgSphere, midSphere, innerSphere].forEach(sphere => {
        if (sphere && sphere.material instanceof THREE.MeshBasicMaterial) {
          updateMeshColor(sphere, bgColor);
        }
      });
      
      // 更新地球颜色
      if (sceneRef.current.earth && sceneRef.current.earth.material) {
        const earthMat = sceneRef.current.earth.material as THREE.MeshBasicMaterial;
        earthMat.color.set(new THREE.Color(newColors.earthBase));
        earthMat.side = THREE.DoubleSide;
        earthMat.needsUpdate = true;
      }
      
      // 更新国家颜色
      sceneRef.current.countries.forEach((object, name) => {
        const isVisited = visitedPlaces.includes(name);
        
        object.traverse((child) => {
          if (child instanceof THREE.Line) {
            const childIsVisited = child.userData?.isVisited === true;
            
            let color;
            if (name.startsWith('中国-')) {
              color = childIsVisited ? newColors.visitedBorder : newColors.chinaBorder;
            } else if (name === '中国') {
              color = newColors.chinaBorder;
            } else {
              color = isVisited ? newColors.visitedBorder : newColors.border;
            }
            
            if (child.material instanceof THREE.LineBasicMaterial) {
              child.material.color.set(new THREE.Color(color));
              child.userData.originalColor = color;
            }
          }
        });
      });
      
      // 暗色模式变化后重新应用渲染优先级
      setTimeout(() => {
        ensureVisitedBordersOnTop();
      }, 50);
    });

    darkModeObserver.observe(document.documentElement, { attributes: true });

    // 添加一个函数来确保已访问区域的边界线总是显示在顶层
    const ensureVisitedBordersOnTop = () => {
      if (!sceneRef.current) return;
      
      // 优化边界线的渲染优先级和材质属性
      const updateLineMaterial = (child: THREE.Object3D) => {
        if (!(child instanceof THREE.Line)) return;
        
        const childIsVisited = child.userData?.isVisited === true;
        child.renderOrder = childIsVisited ? 3 : 2;
        
        if (child.material instanceof THREE.LineBasicMaterial) {
          child.material.depthTest = false;
          
          if (childIsVisited) {
            child.material.polygonOffset = true;
            child.material.polygonOffsetFactor = -2;
            child.material.polygonOffsetUnits = 1;
          }
          
          child.material.needsUpdate = true;
        }
      };
      
      // 遍历所有国家对象
      sceneRef.current.countries.forEach(object => {
        object.traverse(updateLineMaterial);
      });
      
      // 立即渲染一次以应用更改
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
      sceneRef.current.labelRenderer.render(sceneRef.current.scene, sceneRef.current.camera);
    };

    return () => {
      // 清理资源和事件监听器
      if (sceneRef.current) {
        // 取消动画帧
        if (sceneRef.current.animationId !== null) {
          cancelAnimationFrame(sceneRef.current.animationId);
        }
        
        // 处理渲染器的处理
        sceneRef.current.renderer.dispose();
        sceneRef.current.renderer.forceContextLoss();
        sceneRef.current.renderer.domElement.remove();
        
        // 移除标签渲染器
        if (sceneRef.current.labelRenderer) {
          sceneRef.current.labelRenderer.domElement.remove();
        }
        
        // 释放控制器
        if (sceneRef.current.controls) {
          sceneRef.current.controls.dispose();
        }
      }
      
      // 移除事件监听器
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', onMouseMove);
        containerRef.current.removeEventListener('click', onClick);
        containerRef.current.removeEventListener('dblclick', onDoubleClick);
      }
      
      // 移除窗口事件监听器
      window.removeEventListener('resize', handleResize);
      
      // 移除观察器
      darkModeObserver.disconnect();
    };
  }, [visitedPlaces]);

  return (
    <div className="relative">
      <div 
        ref={containerRef} 
        className="w-full h-[400px] sm:h-[450px] md:h-[500px] lg:h-[600px] xl:h-[700px]"
      />
      {hoveredCountry && (
        <div className="absolute bottom-5 left-0 right-0 text-center">
          <div className="inline-block bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-md">
            <p className="text-gray-800 dark:text-white font-medium text-lg">
              {hoveredCountry} 
              {hoveredCountry && visitedPlaces.includes(hoveredCountry) ? 
                ' ✓ 已去过' : ' 尚未去过'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldHeatmap; 