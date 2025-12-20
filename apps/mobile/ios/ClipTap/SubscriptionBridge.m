#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SubscriptionBridge, NSObject)

RCT_EXTERN_METHOD(saveSubscriptionStatus:(BOOL)isPremium
                  expiryDateString:(nullable NSString *)expiryDateString)

RCT_EXTERN_METHOD(clearSubscriptionData)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
