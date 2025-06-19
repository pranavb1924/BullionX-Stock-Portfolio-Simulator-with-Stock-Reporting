import { AuthService} from '../../core/services/auth.service';
import { RegisterRequest } from '../../core/models/auth.models';

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

interface Candle {
  x: number;
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
  opacity: number;
  speed: number;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['../../../styles/auth-card.css']
})
export class RegisterComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('candlestickCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  form: FormGroup;
  isLoading: boolean = false;
  showPassword: boolean = false;
  isMobile: boolean = false;
  success: boolean = false;
  
  private ctx!: CanvasRenderingContext2D;
  private candles: Candle[] = [];
  private animationId?: number;
  private basePrice = 100;
  private time = 0;
  private mouseX = 0;
  private mouseY = 0;
  private targetMouseX = 0;
  private targetMouseY = 0;
  private scrollSpeed = 1.5; // Speed of continuous scrolling
  private lastCandleTime = 0;
  private animationStarted = false;

  constructor(private fb: FormBuilder,
    private authService: AuthService) {
    // Initialize the showPassword property
    this.showPassword = false;
    
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    // Detect mobile device
    this.checkIfMobile();
    window.addEventListener('resize', this.checkIfMobile.bind(this));
    
    // Initialize with some candles only if not mobile
    if (!this.isMobile) {
      this.initializeCandles();
    }
  }

  ngAfterViewInit(): void {
    // Small delay to ensure view is fully initialized
    setTimeout(() => {
      if (!this.isMobile && this.canvasRef?.nativeElement) {
        this.setupCanvas();
        this.initializeCandles();
        this.addEventListeners();
        this.startAnimation();
      }
    }, 100);
  }

  private startAnimation(): void {
    // Ensure we don't have duplicate animation loops
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }
    this.animationStarted = true;
    this.animate();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.removeEventListeners();
    window.removeEventListener('resize', this.checkIfMobile.bind(this));
  }

  private checkIfMobile(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  private initializeCandles(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    
    const width = canvas ? parseInt(canvas.style.width || '800') : 800;
    const candleSpacing = 20;
    const numCandles = Math.floor(width / candleSpacing) + 10;
    
    for (let i = 0; i < numCandles; i++) {

      const trend = Math.sin(i * 0.15) * 30;
      const volatility = Math.sin(i * 0.3) * 20 + Math.random() * 15;
      const open = this.basePrice + trend + (Math.random() - 0.5) * volatility;
      const close = open + (Math.random() - 0.5) * 10;
      
      const wickExtension = Math.random() * 20 + 15; 
      const high = Math.max(open, close) + Math.random() * wickExtension;
      const low = Math.min(open, close) - Math.random() * wickExtension;
      
      this.candles.push({
        x: i * candleSpacing,
        open,
        high,
        low,
        close,
        timestamp: Date.now() - (numCandles - i) * 1000,
        opacity: 1,
        speed: this.scrollSpeed
      });
      
      this.basePrice = close;
    }
  }

  private setupCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    
    if (!parent) return;
    

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    this.ctx = canvas.getContext('2d')!;
    this.ctx.scale(dpr, dpr);
    
    // Set initial mouse position to center
    this.mouseX = rect.width / 2;
    this.mouseY = rect.height / 2;
    this.targetMouseX = this.mouseX;
    this.targetMouseY = this.mouseY;
  }

  private addEventListeners(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    
    if (parent) {
      parent.addEventListener('mousemove', this.handleMouseMove);
      parent.addEventListener('touchmove', this.handleTouchMove);
    }
    
    window.addEventListener('resize', this.handleResize);
  }

  private removeEventListeners(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    
    if (parent) {
      parent.removeEventListener('mousemove', this.handleMouseMove);
      parent.removeEventListener('touchmove', this.handleTouchMove);
    }
    
    window.removeEventListener('resize', this.handleResize);
  }

  private handleResize = (): void => {
    const wasMobile = this.isMobile;
    this.checkIfMobile();
    
    if (wasMobile !== this.isMobile) {
      if (this.isMobile && this.animationId) {
        // Stop animation when switching to mobile
        cancelAnimationFrame(this.animationId);
        this.animationId = undefined;
      } else if (!this.isMobile && !this.animationId && this.canvasRef) {
        // Start animation when switching to desktop
        setTimeout(() => {
          this.setupCanvas();
          this.initializeCandles();
          this.startAnimation();
        }, 9000);
      }
    } else if (!this.isMobile && this.canvasRef?.nativeElement) {
      // Just resize canvas if still on desktop
      this.setupCanvas();
    }
  };

  private handleMouseMove = (e: MouseEvent): void => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.targetMouseX = e.clientX - rect.left;
    this.targetMouseY = e.clientY - rect.top;
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (e.touches.length > 0) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      this.targetMouseX = e.touches[0].clientX - rect.left;
      this.targetMouseY = e.touches[0].clientY - rect.top;
    }
  };

  private animate = (): void => {
    // Always schedule the next frame first
    if (this.animationStarted && !this.isMobile) {
      this.animationId = requestAnimationFrame(this.animate);
    }
    
    // Check if we can actually draw
    if (!this.canvasRef?.nativeElement || !this.ctx || this.isMobile) {
      return;
    }
    
    // Update time
    this.time += 0.01;
    
    // Smooth mouse following
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.1;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.1;
    
    // Continuous scrolling and updating
    this.updateCandles();
    
    // Draw
    this.draw();
  }

  private updateCandles(): void {
    if (!this.canvasRef?.nativeElement) return;
    
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.style.width ? parseInt(canvas.style.width) : 800;
    const candleSpacing = 20;
    
    // Move all candles left continuously
    this.candles.forEach(candle => {
      candle.x -= this.scrollSpeed;
    });
    
    // Remove candles that have scrolled off the left
    this.candles = this.candles.filter(candle => candle.x > -candleSpacing * 2);
    
    // Continuously add new candles on the right
    while (this.candles.length === 0 || this.candles[this.candles.length - 1].x < width + candleSpacing * 2) {
      const lastCandle = this.candles[this.candles.length - 1];
      const newX = lastCandle ? lastCandle.x + candleSpacing : width;
      
      //  dramatic price movements with trends
      const trendPhase = this.time * 2;
      const majorTrend = Math.sin(trendPhase) * 30;
      const minorTrend = Math.sin(trendPhase * 3) * 15;
      const microVolatility = (Math.random() - 0.5) * 20;
      
      const previousClose = lastCandle ? lastCandle.close : this.basePrice;
      const open = previousClose + (Math.random() - 0.5) * 5;
      const closeChange = majorTrend * 0.1 + minorTrend * 0.05 + microVolatility * 0.1;
      const close = open + closeChange;
      
      //  longer wicks for dramatic effect (matching initial candles)
      const volatility = 10 + Math.abs(Math.sin(this.time * 5)) * 20;
      const high = Math.max(open, close) + Math.random() * volatility + 5;
      const low = Math.min(open, close) - Math.random() * volatility - 5;
      
      this.candles.push({
        x: newX,
        open,
        high,
        low,
        close,
        timestamp: Date.now(),
        opacity: 0,
        speed: this.scrollSpeed
      });
      
      // Prevent infinite loop
      if (this.candles.length > 100) break;
    }
    
    // Fade in new candles smoothly
    this.candles.forEach(candle => {
      if (candle.opacity < 1) {
        candle.opacity = Math.min(1, candle.opacity + 0.08);
      }
    });
  }

  private draw(): void {
    if (!this.canvasRef?.nativeElement || !this.ctx) return;
    
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.style.width ? parseInt(canvas.style.width) : canvas.width;
    const height = canvas.style.height ? parseInt(canvas.style.height) : canvas.height;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);
    
    // Always ensure we have candles to draw
    if (this.candles.length < 2) {
      this.initializeCandles();
      return;
    }
    
    // Calculate dimensions
    const padding = 60;
    const chartHeight = height - padding * 2;
    const candleWidth = 8;
    
    // Find visible candles and their price range
    const visibleCandles = this.candles.filter(c => c.x > -50 && c.x < width + 50);
    if (visibleCandles.length === 0) {
      // If no visible candles, reinitialize
      this.initializeCandles();
      return;
    }
    
    const prices = visibleCandles.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices) - 10;
    const maxPrice = Math.max(...prices) + 10;
    const priceRange = maxPrice - minPrice;
    const priceScale = chartHeight / priceRange;
    
    // Draw subtle grid
    this.drawGrid(width, height, padding, minPrice, maxPrice);
    
    // Draw candles with enhanced effects
    visibleCandles.forEach((candle) => {
      const x = candle.x;
      const yOpen = padding + (maxPrice - candle.open) * priceScale;
      const yClose = padding + (maxPrice - candle.close) * priceScale;
      const yHigh = padding + (maxPrice - candle.high) * priceScale;
      const yLow = padding + (maxPrice - candle.low) * priceScale;
      
      // Skip if completely outside viewport
      if (x < -candleWidth || x > width + candleWidth) return;
      
      // Calculate distance from mouse for interactive effect
      const candleCenter = (yOpen + yClose) / 2;
      const distance = Math.sqrt(Math.pow(x - this.mouseX, 2) + Math.pow(candleCenter - this.mouseY, 2));
      const maxDistance = 120;
      const influence = Math.max(0, 1 - distance / maxDistance);
      
      // Determine color with gradient based on price movement
      const isGreen = candle.close >= candle.open;
      const baseColor = isGreen ? '#00D632' : '#FF4747';
      const glowColor = isGreen ? 'rgba(0, 214, 50, 0.4)' : 'rgba(255, 71, 71, 0.4)';
      const opacity = candle.opacity * (0.7 + influence * 0.3);
      
      // Draw wick with enhanced style
      this.ctx.save();
      this.ctx.strokeStyle = baseColor;
      this.ctx.lineWidth = 1.5 + influence * 0.5;
      this.ctx.globalAlpha = opacity;
      
      // Add glow for nearby candles
      if (influence > 0.1) {
        this.ctx.shadowBlur = 15 + influence * 25;
        this.ctx.shadowColor = glowColor;
      }
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, yHigh);
      this.ctx.lineTo(x, yLow);
      this.ctx.stroke();
      
      // Draw body with gradient
      const bodyHeight = Math.abs(yClose - yOpen) || 2;
      const bodyY = Math.min(yOpen, yClose);
      const actualCandleWidth = candleWidth * (1 + influence * 0.4);
      
      // Create gradient for body
      const gradient = this.ctx.createLinearGradient(x - actualCandleWidth / 2, bodyY, x + actualCandleWidth / 2, bodyY + bodyHeight);
      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(0.5, isGreen ? '#00FF3F' : '#FF6B6B');
      gradient.addColorStop(1, baseColor);
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x - actualCandleWidth / 2, bodyY, actualCandleWidth, bodyHeight);
      
      this.ctx.restore();
    });
    
    // Draw subtle vignette effect
    const vignette = this.ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, width, height);
  }

  private drawGrid(width: number, height: number, padding: number, minPrice: number, maxPrice: number): void {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    this.ctx.lineWidth = 1;
    
    // Horizontal lines
    const horizontalLines = 8;
    for (let i = 0; i <= horizontalLines; i++) {
      const y = padding + (height - padding * 2) / horizontalLines * i;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
    
    // Vertical lines that move with the candles for fluid effect
    const verticalSpacing = 50;
    const offset = (this.time * this.scrollSpeed * 10) % verticalSpacing;
    
    for (let i = -1; i < width / verticalSpacing + 2; i++) {
      const x = i * verticalSpacing - offset;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const req = this.form.value as RegisterRequest;
    this.authService.register(req).subscribe({
      next: user => {
        console.log('Registered:', user);
        this.isLoading = false;
        this.success = true;
      },
      error: err => {
        console.error('Registration failed', err);
        this.isLoading = false;
      }
    });
  }
}