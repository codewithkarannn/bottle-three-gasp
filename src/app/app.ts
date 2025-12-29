import { AfterViewInit, Component, ElementRef, ViewChild, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger'; // 1. Import ScrollTrigger
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// 2. Register the plugin
gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit { // 3. Use AfterViewInit
  protected readonly title = signal('bottle');
  @ViewChild('container') container!: ElementRef;
  @ViewChild('animatedText') animatedText!: ElementRef;
  @ViewChild('paraLeft') paraLeft!: ElementRef;
  @ViewChild('paraRight') paraRight!: ElementRef;
  @ViewChild('circle') circle!: ElementRef;
  @ViewChild('threeCanvas') threeCanvas!: ElementRef;
  @ViewChild('secondText') secondText!: ElementRef;
  @ViewChild('dotLeft') dotLeft!: ElementRef;
  @ViewChild('dotRight') dotRight!: ElementRef;
  @ViewChild('connectionLineLeft') connectionLineLeft!: ElementRef;
  @ViewChild('connectionLineRight') connectionLineRight!: ElementRef;
  @ViewChild('conectionLineRightContent') connectionLineRightContent!: ElementRef;
  @ViewChild('conectionLineLeftContent') connectionLineLeftContent!: ElementRef;
  private model: THREE.Group | null = null;
  private tl!: gsap.core.Timeline;
  ngAfterViewInit() {
    this.initAnimation();
    this.initThreeJS();
  }

  initThreeJS() {
    // 1. SCENE: The "World"
    const scene = new THREE.Scene();

    // 2. SIZES
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 3. CAMERA: The "Eyes"
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 3;
    scene.add(camera);

    // 4. LIGHTS: Essential to see the model
    const ambientLight = new THREE.AmbientLight(0xffffff, 2); // Soft white light
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 3);
    sunLight.position.set(5, 5, 5);
    scene.add(sunLight);

    // 5. RENDERER: The "Painter"
    const renderer = new THREE.WebGLRenderer({
      canvas: this.threeCanvas.nativeElement,
      alpha: true, // Transparent background
      antialias: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 6. LOAD GLB MODEL
    const loader = new GLTFLoader();
    // Replace 'assets/model.glb' with the actual path to your file
    loader.load('32oz_water_flask.glb', (gltf) => {
      this.model = gltf.scene;

      // 1. Create a Pivot (The tilted axis)
      const pivot = new THREE.Group();
      scene.add(pivot);

      // 2. Put the model inside the pivot
      pivot.add(this.model);

      // 3. Position and Scale (Apply these to the model OR the pivot)
      this.model.position.y = -1.2;
      this.model.scale.set(0.8, 0.8, 0.8);

      // 4. THE AXIAL TILT (Like Earth's 23.5 degrees)
      // We tilt the PIVOT. This stays fixed.
      pivot.rotation.z = 0.41; // 0.41 radians is approx 23.5 degrees
      pivot.rotation.x = 0.2;
      // 5. THE SCROLL ROTATION
      // We animate the MODEL's rotation.y inside the tilted pivot.
      this.tl.to(this.model.rotation, {
        y: Math.PI * 8, // Spins around the tilted axis
        ease: 'none',
        duration: 2.5
      }, 0);
    });
    // 7. ANIMATION LOOP: Runs every frame
    const tick = () => {
      // if (this.model) {
      //   this.model.rotation.y += 0.01; // Constant rotation
      // }
      renderer.render(scene, camera);
      window.requestAnimationFrame(tick);
    };
    tick();

    // 8. HANDLE RESIZE
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }


  initAnimation() {
    const textElement = this.animatedText.nativeElement;
    const content = textElement.textContent;
    const circleElement = this.circle.nativeElement;


    // 1. SPLIT LETTERS (Same as before)
    textElement.innerHTML = content.split("").map((char: string) =>
      `<span class="letter" style="display: inline-block;">${char === " " ? "&nbsp;" : char}</span>`
    ).join("");
    const letters = textElement.querySelectorAll('.letter');

    // 2. REFRESH ENTRANCE: The letters sunrise on load
    gsap.from(letters, {

      y: 100,
      opacity: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.05,
      delay: 0.2
    });

    // 3. THE MASTER SCROLL TIMELINE
     this.tl = gsap.timeline({
      scrollTrigger: {
        trigger: this.container.nativeElement,
        start: 'top top',
        end: '+=5000',
        scrub: 1,
        pin: true,
        anticipatePin: 1
      }
    });

    // STAGE A: Big Text starts moving Left
    this.tl.to(textElement, { x: '-100vw', ease: 'none' }, 0);

    // STAGE B: Paragraphs Sunrise (Enter)
    // Starts at the beginning (0)
    this.tl.to([this.paraLeft.nativeElement, this.paraRight.nativeElement], {
      opacity: 1,
      y: 0,
      duration: 0.1
    }, 0);

    // STAGE C: Paragraphs Exit (Fade out as text keeps moving)
    // "0.8" means it happens slightly later in the timeline
    this.tl.to([this.paraLeft.nativeElement], {
      opacity: 0,
      y: -50, // Move them out of view
      duration: 0.2
    }, 0.1);

    this.tl.to([this.paraRight.nativeElement], {
      opacity: 0,
      y: +50, // Move them out of view
      duration: 0.2
    }, 0.1);

    // STAGE D: Big Text finishes exit
    this.tl.to(textElement, { x: '-100vw', ease: 'none' }, 0.8);

    // STAGE E: Circle Expansion
    // This starts just as the text is leaving (at 1.2 on the timeline)
    this.tl.to(this.circle.nativeElement, {
      scale: 100,       // Grow huge to cover screen
      duration: 0.2,
      ease: 'power2.in' // Starts slow, gets fast
    }, 0.2);


    this.tl.to(this.secondText.nativeElement, {
      x: '-150vw', // Move from 100vw (CSS) all the way to the left
      ease: 'none',
    }, 0.3);


    // 1. Dots appear (Fade in at 2.2 just as text exits)
    this.tl.to([this.dotLeft.nativeElement, this.dotRight.nativeElement], {
      opacity: 1,
      scale: 1.5,
      duration: 0.1
    }, 0.5);

    // 2. Line appears and "Draws"

    this.tl.to(this.connectionLineLeft.nativeElement, {
      opacity: 1,
      width: '27%', // Adjust based on your screen/angle
      duration: 0.1,
      ease: 'power2.inOut'
    }, 0.6); // Starts slightly after dots appear

    this.tl.to(this.connectionLineRight.nativeElement, {
      opacity: 1,
      width: '27%', // Adjust based on your screen/angle
      duration: 0.1,
      ease: 'power2.inOut'
    }, 0.6); // Starts slightly after dots appear

    this.tl.to([this.connectionLineRightContent.nativeElement], {
      opacity: 1,
      y: 0,
      duration: 0.1
    }, 0.7);

    this.tl.to([this.connectionLineLeftContent.nativeElement], {
      opacity: 1,
      y: 0,
      duration: 0.1
    }, 0.7);



  }
}
