import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
}

@Component({
  selector: 'app-signup',
  standalone: true, // Standalone component
  imports: [FormsModule], // Required for ngModel and form directives
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  user = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  ngOnInit(): void {
    this.startCandlestickAnimation();
  }

  onSubmit() {
    console.log('User Registered:', this.user);
    alert('Signup successful! (Backend integration pending)');
  }

  startCandlestickAnimation() {
    const canvas = document.getElementById('stockCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill the left panel
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Resize the canvas if window changes
    window.addEventListener('resize', () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });

    // Candle dimensions
    const candleWidth = 10;
    const candleSpacing = 5;
    const totalCandleWidth = candleWidth + candleSpacing;
    let numCandles = Math.floor(canvas.width / totalCandleWidth) + 2;

    // Candlestick data array
    let candles: Candle[] = [];
    // We'll treat the vertical center as the base price
    const basePrice = canvas.height / 2;

    // Generate big fluctuations
    function generateCandle(prev: Candle | null): Candle {
      const open = prev ? prev.close : basePrice;
      // Even bigger range: random change between -100 and +100
      const change = Math.random() * 200 - 100;
      const close = open + change;
      // High is the max of open/close plus random up to 40
      const high = Math.max(open, close) + Math.random() * 80;
      // Low is the min of open/close minus random up to 40
      const low = Math.min(open, close) - Math.random() * 40;

      return { open, high, low, close };
    }

    // Initialize
    for (let i = 0; i < numCandles; i++) {
      const candle = i === 0 ? generateCandle(null) : generateCandle(candles[i - 1]);
      candles.push(candle);
    }

    let offsetX = 0; // For scrolling left

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Recalc numCandles if width changed
      numCandles = Math.floor(canvas.width / totalCandleWidth) + 2;

      // Draw each candle
      for (let i = 0; i < candles.length; i++) {
        const candle = candles[i];
        const x = i * totalCandleWidth - offsetX;

        // Only draw if it's in visible range
        if (x < -candleWidth || x > canvas.width) continue;

        // Wick
        const centerX = x + candleWidth / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, candle.high);
        ctx.lineTo(centerX, candle.low);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Candle body color: green if bullish, red if bearish
        const bodyColor = candle.close >= candle.open ? '#1ec776' : '#e74c3c';
        const bodyTop = Math.min(candle.open, candle.close);
        const bodyHeight = Math.abs(candle.close - candle.open) || 1;

        ctx.fillStyle = bodyColor;
        ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
      }

      // Scroll the chart left
      offsetX += 0.5;
      if (offsetX >= totalCandleWidth) {
        offsetX = 0;
        // Remove the oldest candle and add a new one
        candles.shift();
        const lastCandle = candles[candles.length - 1];
        candles.push(generateCandle(lastCandle));
      }

      requestAnimationFrame(animate);
    };

    animate();
  }
}
