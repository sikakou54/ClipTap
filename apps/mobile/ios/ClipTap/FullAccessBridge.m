//
//  FullAccessBridge.m
//  ClipTap
//
//  FullAccessBridgeのObjective-Cブリッジ定義
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(FullAccessBridge, NSObject)

RCT_EXTERN_METHOD(getKeyboardFullAccessStatus:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(isUsageTrackingEnabled:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
