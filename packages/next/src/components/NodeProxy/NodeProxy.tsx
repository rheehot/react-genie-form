import React, {
  Fragment,
  ReactNode,
  isValidElement,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react';

import useFormComponent from './useFormComponent';
import useTargetNode from './useTargetNode';
import { useConstant, useObjectSnapshot, useTracker } from '../../hooks';
import { Node } from '../../nodes';
import { FormTypesContext, RenderContext } from '../../providers';
import styles from './NodeProxy.module.scss';

NodeProxy.classNames = { ...styles };

interface INodeProxyProps {
  path?: string;
  node: Node;
  restProps?: any;
  renderNode?: Function;
  form?: any[];
  Wrapper?: any;
}

interface INodeProxyPropsAlt {
  path: string;
  node?: Node;
  restProps?: any;
  renderNode?: Function;
  form?: any[];
  Wrapper?: any;
}

function NodeProxy({
  path,
  node: _node,
  restProps: rest,
  renderNode: _renderNode,
  form,
  Wrapper,
}: INodeProxyProps | INodeProxyPropsAlt) {
  const restProps = useRef<any>({});
  restProps.current = useObjectSnapshot(rest);

  const { node, show } = useTargetNode(path, _node);

  const __renderNode = useContext(RenderContext);

  const renderNode = _renderNode || __renderNode;

  const form_ = useRef<any>();
  form_.current = form;

  const Input = useMemo(() => {
    return node ? (
      (overrideProps: any) => (
        <Adapter
          node={node}
          restProps={restProps.current}
          overrideProps={overrideProps}
          renderNode={renderNode}
          form={form_.current}
        />
      )
    ) : (
        <Fragment />
      );
  }, [node, restProps, renderNode]);

  const Renderer = useMemo(
    () => (renderNode ? renderNode : ({ Input }: any) => <Input />),
    [renderNode],
  );

  const count = useRef(0);
  count.current++;

  const Wrap = Wrapper || Fragment

  return (
    node &&
    show && (
      <Wrap>
        <Renderer
          isArrayItem={node.isArrayItem}
          depth={node.depth}
          path={node.path}
          name={node.name}
          value={node.getValue()}
          errors={node.getErrors()}
          schema={node.schema}
          Input={Input}
        />
      </Wrap>
    )
  );
}

export default NodeProxy;

interface IAdapterProps extends INodeProxyProps {
  node: Node;
  overrideProps?: any;
}

function Adapter({
  node,
  restProps: rest,
  overrideProps,
  renderNode,
  form,
}: IAdapterProps) {
  let children_: any[] = node.children();
  // const type = node.schema.type;

  const restProps = useObjectSnapshot({ ...rest, ...overrideProps });
  // let children = children_;

  // const _form = useMemo(() => {
  //   if (Array.isArray(form)) {
  //     form
  //   }
  // }, [form])

  const childrenGrps = useMemo(() => {
    let rows = [];

    if (Array.isArray(form)) {
      const isGrid = !!form.find((e) => Array.isArray(e));
      let grid;
      if (isGrid) {
        grid = form.map((e) => {
          return (Array.isArray(e) ? e : [e]).map((e) => {
            if (typeof e === 'string') {
              return {
                name: e,
              };
            }
            return e;
          });
        });
      } else {
        grid = [form];
      }

      rows = grid.map((form) => {
        return form
          .map((e) => {
            let nodeName: any;
            let rest = {};
            if (typeof e === 'string') {
              nodeName = e;
            } else if (typeof e?.name === 'string') {
              nodeName = e?.name;
              const { name, ..._rest } = e;
              rest = _rest;
            }

            if (nodeName) {
              return {
                ...rest,
                node: node.findNode(nodeName),
              };
            }
            if (isValidElement(e)) {
              return {
                element: e,
              };
            }
            if (isValidElement(e?.element)) {
              return e;
            }
            return null;
          })
          .filter(Boolean);
      });

      // [];
    } else {
      rows = [children_];
    }
    return rows;
  }, [children_, form, node]);

  // const dict = useRef<{ [key: string]: any }>({});
  // const weakMap = useRef(new WeakMap());
  // const seq = useRef(0);
  // const childNodes = useMemo(
  //   () =>
  //     ['object', 'array', 'virtual'].includes(type)
  //       ? children
  //           .filter(({ node, isVirtualized, element }: any) =>
  //           (node && isVirtualized !== true) || element)
  //           .map(({ node, element }: any) => {
  //             if (element) {
  //               if (!weakMap.current.has(element)) {
  //                 const Element = () => element;
  //                 Element.key = `element_${seq.current++}`;
  //                 weakMap.current.set(element, Element)
  //               }
  //               return weakMap.current.get(element);
  //             } else if (!dict.current[node.path]) {
  //               dict.current[node.path] = React.memo((props: any) => (
  //                 <NodeProxy node={node} restProps={props} />
  //               ));
  //               dict.current[node.path].key = node.path;
  //             }
  //             return dict.current[node.path];
  //           })
  //       : undefined,
  //   [type, children, dict, weakMap],
  // );

  // const Wrap = useMemo(() => {

  // }, [childrenGrps.length])

  return (
    <>
      {childrenGrps.map((e, i, arr) => {
        if (arr.length === 1) {
          return (
            <Row key={i} node={node} restProps={restProps} childItems={e} />
          );
        }
        return (
          <div
            className={styles.row}
            key={i}
            style={{
              // border: '5px solid blue', padding: 10,
              display: 'flex',
            }}
          >
            <Row key={i} node={node} restProps={restProps} childItems={e} />
          </div>
        );
      })}
    </>
  );

  // return (
  //   <>
  //     {/* <div>
  //     <pre>{JSON.stringify(form)}</pre> */}
  //     <AdapterCore node={node} restProps={restProps} childNodes={childNodes} />
  //     {/* </div> */}
  //   </>
  // );
}

const Row = ({ node, childItems: children, restProps }: any) => {
  const type = node.schema.type;

  // const restProps = useObjectSnapshot({ ...rest, ...overrideProps });

  const dict = useRef<{ [key: string]: any }>({});
  const weakMap = useRef(new WeakMap());
  const seq = useRef(0);
  const childNodes = useMemo(
    () =>
      ['object', 'array', 'virtual'].includes(type)
        ? children
          .filter(
            ({ node, isVirtualized, element }: any) =>
              (node && isVirtualized !== true) || element,
          )
          .map(({ node, element, grid }: any) => {
            let styleProps: any = {
              display: 'block',
              // flex: '1 1 auto',
              flexGrow: 1,
              flexShrink: 1,
              flexBasis: '100%',
              paddingLeft: 5,
              paddingRight: 5,
            };
            if (typeof grid === 'number') {
              styleProps = {
                ...styleProps,
                // flex: '1 0 ',
                flexGrow: 1,
                flexShrink: 0,
                flexBasis: `${(100 / 12) * grid}%`,
                width: `${(100 / 12) * grid}%`,
              };
            }
            if (element) {
              if (!weakMap.current.has(element)) {
                const Element = () => {
                  return <div style={styleProps}>{element}</div>;
                };
                Element.key = `element_${seq.current++}`;
                weakMap.current.set(element, Element);
              }
              return weakMap.current.get(element);
            } else if (!dict.current[node.path]) {

              const Wrapper = ({ children }: any) => {
                return (
                  <div className={styles.column} style={styleProps}>
                    {children}
                  </div>
                )
              }
              dict.current[node.path] = React.memo((props: any) => {


                return (
                  (



                    <NodeProxy node={node} restProps={props} Wrapper={Wrapper} />

                  )
                )
              });
              dict.current[node.path].key = node.path;
            }
            return dict.current[node.path];
          })
        : undefined,
    [type, children, dict, weakMap],
  );

  return (
    <>
      {/* <div>
      <pre>{JSON.stringify(form)}</pre> */}
      <AdapterCore node={node} restProps={restProps} childNodes={childNodes} />
      {/* </div> */}
    </>
  );
};

interface IAdapterCoreProps {
  node: Node;
  restProps?: any;
  childNodes?: ReactNode[];
}

const AdapterCore = React.memo(
  ({ node, childNodes, restProps }: IAdapterCoreProps) => {
    const { schema, setValue, getValue } = node;

    const formTypes = useContext(FormTypesContext);
    const FormComponent = useFormComponent(node, formTypes);

    // const [, setTick] = useState(0);
    // useEffect(() => {
    //   const unsubscribe = node.subscribe(() => {
    //     setTick((state) => state + 1);
    //     console.log('>>>> st tick', node.name);
    //   });
    //   return () => {
    //     unsubscribe();
    //   };
    // }, [node, setTick]);

    useTracker(node);

    const _defaultValue = useConstant(getValue());

    const count = useRef(0);
    count.current++;

    const formComponentProps = useMemo(
      () => ({
        ...(node?.schema?.type === 'array' ? { node } : {}),
        ...(childNodes ? { childNodes } : {}),
      }),
      [node, childNodes],
    );

    const handleChange = useCallback(
      (value: any) => {
        if (typeof setValue === 'function') {
          setValue(value);
        }
        node.setState({ dirty: true, touched: true });
      },
      [setValue, node],
    );

    const handleBlur = useCallback(
      (value: any) => {
        node.setState({ touched: true });
      },
      [node],
    );

    const { dirty, touched } = node.getState();

    return FormComponent ? (
      <FormComponent
        {...restProps}
        schema={schema}
        defaultValue={_defaultValue}
        value={getValue()}
        onChange={handleChange}
        onBlur={handleBlur}
        {...formComponentProps}
      />
    ) : null;
  },
);