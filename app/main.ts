import EsriMap from "esri/Map";
import MapView from "esri/views/MapView";
import FeatureLayer from "esri/layers/FeatureLayer";
import LayerList from "esri/widgets/LayerList";
import Compass from "esri/widgets/Compass";
import ScaleRangeSlider from "esri/widgets/ScaleRangeSlider";
import Search from "esri/widgets/Search";
import SceneView from "esri/views/SceneView";
import View from "esri/views/View";
import { Point } from "esri/geometry";

import WatchWidget from "./WatchWidget";
import GeometryWidget from "./GeometryWidget";
import FeatureLayerView from "esri/views/layers/FeatureLayerView";
import GraphicsLayer from "esri/layers/GraphicsLayer";

class LearnJsapi4App {

  private map : EsriMap;
  mapView: MapView;
  sceneView: SceneView;
  weinLayer: FeatureLayer;
  weinQuery: __esri.Query;
  fotoLayer: FeatureLayer;
  geometryLayer: GraphicsLayer;
  
  constructor() {
    this.initializeMap();
    this.addWeinLayer();
    this.addFotoLayer();
    this.geometryLayer = this.initNewGraphicsLayer("geometryLayer");
    this.mapView = this.viewFactory(MapView, "mapDiv");
    this.sceneView = this.viewFactory(SceneView, "sceneDiv");
    this.addCenterWatch(this.mapView, this.sceneView);
  }

  private addCenterWatch(watchView: View, setCenterView: View) {
    let watchHandle = watchView.watch("stationary", (s: boolean) => {
      if (s) {
        setCenterView.watch("center", (c: Point) => {
          this.mapView.center = c;
        });
        watchHandle.remove();
      }
    });
  }

  private initializeMap() {
    this.map = new EsriMap({
      basemap: "gray-vector"
    });
  }

  private initNewGraphicsLayer(id: string) {
    let gl = new GraphicsLayer({
      id: id
    });
    this.map.add(gl);
    return gl;
  }

  private viewFactory<V extends View>(view: new(parameters: object) => V, containerDiv: string): V {
    let initView = new view({
      map: this.map,
      container: containerDiv
    });

    initView.when(() => {
      this.addWidgets(initView);

      this.weinLayer.queryExtent(this.weinQuery).then((result: any) => {
        initView.goTo(result.extent, {
          animate: true,
          duration: 10000,
          easing: "ease-out"
        });
      });
    });
    return initView;
  }

  private addWeinLayer() {
    this.weinLayer = new FeatureLayer({
      url: "http://services.arcgis.com/OLiydejKCZTGhvWg/arcgis/rest/services/WeinanbauGebiete/FeatureServer/0"
    });
    this.map.add(this.weinLayer);
    this.weinQuery = this.weinLayer.createQuery();
    this.weinQuery.where = "1=1";
    this.weinQuery.outFields = ["*"];
  }

  private addFotoLayer() {
    let template = {
      // autocasts as new PopupTemplate()
      title: "{Titel_Hotel_Sehenswürdigkeit_L} in {Stadtbezirk}",
      content: [
        {
          // It is also possible to set the fieldInfos outside of the content
          // directly in the popupTemplate. If no fieldInfos is specifically set
          // in the content, it defaults to whatever may be set within the popupTemplate.
          type: "fields",
          fieldInfos: [
            {
              fieldName: "Adresse_Straße_Hausnummer",
              label: "Adresse"
            },
            {
              fieldName: "Postleitzahl",
              label: "PLZ"
            }
          ]
        },
        {
          type: "media",
          mediaInfos: [{
            title: "{Titel_Hotel_Sehenswürdigkeit_L}",
            type: "image", // Autocasts as new ImageMediaInfo()
            caption: "{Stadtbezirk}",
            // Autocasts as new ImageMediaInfoValue()
            value: {
              sourceURL: "{BildURL}"
            }
          }]
        }
      ]
    };

    this.fotoLayer = new FeatureLayer({
      url: "http://services.arcgis.com/OLiydejKCZTGhvWg/arcgis/rest/services/Sehenswuerdigkeiten_POIs_3/FeatureServer/0",
      popupTemplate: template
    });
    this.map.add(this.fotoLayer);

  }
  
  private addWidgets(view: View) {
    let layerList = new LayerList({
      view: view
    });
    view.ui.add(layerList, {
      position: "bottom-right",
      index: 0
    });
  
    if (view.type=="2d") {
      let compass = new Compass({
        view: view
      });
      view.ui.add(compass, "top-left");
    }
  
    let scaleRangeSlider = new ScaleRangeSlider({
      view: view,
      layer: this.weinLayer,
      region: "DE"
    });
    view.ui.add(scaleRangeSlider, "bottom-left");
    scaleRangeSlider.watch(["minScale", "maxScale"], function(value, oldValue, name) {
      this.weinLayer[name] = value;
    });
  
    let searchWidget = new Search({
      view: view
    });
    view.ui.add(searchWidget, {
      position: "top-right",
      index: 0
    });

    // Custom Widgets
    let watchWidget = new WatchWidget(view);
    view.ui.add(watchWidget, {
      position: "top-right",
      index: 1
    });

    let geometryWidget = new GeometryWidget(view);
    geometryWidget.setSelectionTarget(this.weinLayer);
    geometryWidget.setGraphicsLayer(this.geometryLayer);
    view.whenLayerView(this.weinLayer).then((layerView: FeatureLayerView) => {
      geometryWidget.setLayerView(layerView);
    });
    view.ui.add(geometryWidget, {
      position: "top-right",
      index: 1
    });
  }
  
}

let app = new LearnJsapi4App();