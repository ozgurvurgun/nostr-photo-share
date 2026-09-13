import {useEffect} from 'react';
import {Linking} from 'react-native';
import {
  parseDeepLink,
  type DeepLinkRoute,
} from '../../../../app/navigation/linking';

export type UseDeepLinkRoutingOptions = {
  readonly onRoute: (route: DeepLinkRoute) => void;
};

/**
 * Foundation hook: parse incoming still:// and nostr: links and forward routes.
 * Feature screens decide how far to act on each route type.
 */
export function useDeepLinkRouting({onRoute}: UseDeepLinkRoutingOptions): void {
  useEffect(() => {
    let active = true;

    async function handleInitial(): Promise<void> {
      const url = await Linking.getInitialURL();
      if (!active || url == null) {
        return;
      }
      const route = parseDeepLink(url);
      if (route) {
        onRoute(route);
      }
    }

    void handleInitial();

    const subscription = Linking.addEventListener('url', event => {
      const route = parseDeepLink(event.url);
      if (route) {
        onRoute(route);
      }
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [onRoute]);
}
