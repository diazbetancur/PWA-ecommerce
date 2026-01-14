import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { TenantContextService } from '@pwa/core';

@Component({
  selector: 'app-whatsapp-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whatsapp-button.component.html',
  styleUrl: './whatsapp-button.component.scss',
})
export class WhatsappButtonComponent {
  private readonly tenantContext = inject(TenantContextService);
  private readonly buttonRef =
    viewChild<ElementRef<HTMLAnchorElement>>('button');

  isDragging = signal(false);
  position = signal({ bottom: 24, right: 24 });

  private dragStartPos = { x: 0, y: 0 };
  private initialPos = { bottom: 24, right: 24 };
  private hasMoved = false;

  whatsappNumber = computed(() => {
    const config = this.tenantContext.getCurrentTenantConfig();
    return config?.contact?.whatsApp || '';
  });

  whatsappUrl = computed(() => {
    const number = this.whatsappNumber().replace(/\D/g, '');
    const config = this.tenantContext.getCurrentTenantConfig();
    const message =
      config?.messages?.welcome ||
      '¡Hola! Me gustaría obtener más información.';
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  });

  onDragStart(event: MouseEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    this.startDrag(event.clientX, event.clientY);
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    this.startDrag(touch.clientX, touch.clientY);
  }

  private startDrag(clientX: number, clientY: number): void {
    this.isDragging.set(true);
    this.hasMoved = false;
    this.dragStartPos = { x: clientX, y: clientY };
    this.initialPos = { ...this.position() };
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging()) return;
    event.preventDefault();
    this.updatePosition(event.clientX, event.clientY);
  }

  @HostListener('window:touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging() || event.touches.length !== 1) return;
    const touch = event.touches[0];
    this.updatePosition(touch.clientX, touch.clientY);
  }

  private updatePosition(clientX: number, clientY: number): void {
    const deltaX = this.dragStartPos.x - clientX;
    const deltaY = this.dragStartPos.y - clientY;

    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      this.hasMoved = true;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const buttonSize = 56;
    const padding = 16;

    const newRight = Math.max(
      padding,
      Math.min(
        viewportWidth - buttonSize - padding,
        this.initialPos.right + deltaX
      )
    );
    const newBottom = Math.max(
      padding,
      Math.min(
        viewportHeight - buttonSize - padding,
        this.initialPos.bottom + deltaY
      )
    );

    this.position.set({ right: newRight, bottom: newBottom });
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  onDragEnd(): void {
    if (!this.isDragging()) return;

    if (this.hasMoved) {
      const button = this.buttonRef()?.nativeElement;
      if (button) {
        button.style.pointerEvents = 'none';
        setTimeout(() => {
          button.style.pointerEvents = '';
        }, 100);
      }
    }

    this.isDragging.set(false);
    this.snapToEdge();
  }

  private snapToEdge(): void {
    const viewportWidth = window.innerWidth;
    const currentRight = this.position().right;
    const buttonCenter = viewportWidth - currentRight - 28;

    const snapRight =
      buttonCenter < viewportWidth / 2 ? viewportWidth - 56 - 24 : 24;

    this.position.update((pos) => ({ ...pos, right: snapRight }));
  }
}
