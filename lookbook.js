class LookBook {
  constructor(container) {
    this.containerNode = container;

    this.lookBookCanvasContainerNode = this.containerNode.querySelector('.js-lookbook-canvas-container');
    this.lookBookItemNodes = this.containerNode.querySelectorAll('.js-lookbook-item');
    this.downloadButtonNode = this.containerNode.querySelector('.js-lookbook-download');

    this.lookBookItems = [];
    this.pixiApp = null;

    this.init();
  }

  init() {
    this.initCanvas();
    this.initLookBookItems();
    this.initDownloadButton();
  }

  initCanvas() {
    const requiredCanvasDimensions = this.lookBookCanvasContainerNode.getBoundingClientRect();

    this.pixiApp = new PIXI.Application({
      width: requiredCanvasDimensions.width,
      height: requiredCanvasDimensions.height,
      transparent: true,
    });

    this.lookBookCanvasContainerNode.appendChild(this.pixiApp.view);
  }

  initLookBookItems() {
    this.lookBookItemNodes.forEach(lookBookItemNode => {
      const newLookBookItem = {
        node: lookBookItemNode,
        isSelected: false,
        canvasItem: null,
      }

      this.lookBookItems.push(newLookBookItem)

      lookBookItemNode.addEventListener('click', () => {
        this.handleLookBookItemClick(newLookBookItem);
      });
    })
  }

  initDownloadButton() {
    this.downloadButtonNode.addEventListener('click', () => {
      this.downloadImage();
    })
  }

  handleLookBookItemClick(lookBookItem) {
    lookBookItem.isSelected = !lookBookItem.isSelected;

    this.updateItemsState();
  }

  updateItemsState() {
    this.lookBookItems.forEach(async (lookBookItem) => {
      const {
        node,
        isSelected,
        canvasItem,
       } = lookBookItem;

      if (isSelected) {
        node.classList.add('is-selected');

        if (!canvasItem) {
          const newCanvasItem = await this.addItemOnCanvas(node.dataset.image);

          lookBookItem.canvasItem = newCanvasItem;
        }
      } else {
        node.classList.remove('is-selected');

        if (canvasItem) {
          this.pixiApp.stage.removeChild(canvasItem);
          lookBookItem.canvasItem = null;
        }
      }
    })
  }

  async addItemOnCanvas(itemUrl) {
    const texture = PIXI.Texture.from(itemUrl, {
      resourceOptions: { autoLoad: false }
    });

    await texture.baseTexture.resource.load();

    texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

    return createCanvasItem(this.pixiApp, texture);
  }

  downloadImage() {
    this.pixiApp.renderer.plugins.extract.canvas(this.pixiApp.stage).toBlob(function (b) {
      var a = document.createElement("a");
      document.body.append(a);
      a.download = 'lookbook';
      a.href = URL.createObjectURL(b);
      a.click();
      a.remove();
    }, "image/png");
  }
}

function createCanvasItem(app, texture) {
  const targetPosition = [app.view.width / 2, app.view.height / 2];
  const targetSpriteHeight = app.view.height / 4;
  const textureAspectRatio = texture.baseTexture.width / texture.baseTexture.height;

  // create our little item...
  const canvasItem = new PIXI.Sprite(texture);

  canvasItem.height = targetSpriteHeight;
  canvasItem.width = canvasItem.height * textureAspectRatio;

  // enable the item to be interactive... this will allow it to respond to mouse and touch events
  canvasItem.interactive = true;

  // this button mode will mean the hand cursor appears when you roll over the item with your mouse
  canvasItem.buttonMode = true;

  // center the item's anchor point
  canvasItem.anchor.set(0.5);

  // setup events for mouse + touch using
  // the pointer events
  canvasItem
      .on('pointerdown', onDragStart)
      .on('pointerup', onDragEnd)
      .on('pointerupoutside', onDragEnd)
      .on('pointermove', onDragMove);

  // For mouse-only events
  // .on('mousedown', onDragStart)
  // .on('mouseup', onDragEnd)
  // .on('mouseupoutside', onDragEnd)
  // .on('mousemove', onDragMove);

  // For touch-only events
  // .on('touchstart', onDragStart)
  // .on('touchend', onDragEnd)
  // .on('touchendoutside', onDragEnd)
  // .on('touchmove', onDragMove);

  // move the sprite to its designated position
  canvasItem.x = targetPosition[0];
  canvasItem.y = targetPosition[1];

  // add it to the stage
  app.stage.addChild(canvasItem);

  return canvasItem;
}

function onDragStart(event) {
  // the reason for this is because of multitouch
  // we want to track the movement of this particular touch
  this.data = event.data;
  this.alpha = 0.8;
  this.dragging = true;
}

function onDragEnd() {
  this.alpha = 1;
  this.dragging = false;
  // set the interaction data to null
  this.data = null;
}

function onDragMove() {
  if (this.dragging) {
    const newPosition = this.data.getLocalPosition(this.parent);
    this.x = newPosition.x;
    this.y = newPosition.y;
  }
}