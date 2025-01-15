import { Link } from '@/components/Link';
import { QueryProvider } from '@/components/QueryProvider';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { GitLabPipelinesResponse } from '@/models/pipelines';
import { zodResolver } from '@hookform/resolvers/zod';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Circle, LoaderCircleIcon } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  token: z.string().min(1, 'Access token is required'),
  project: z.string().min(1, 'Project is required'),
  pipelineVariablesFilter: z.string()
});

const FETCH_PARAMS_KEY = 'gitlab:listpipelines:fetchparams';

function ListPipelinesComponent() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token: '',
      project: '',
      pipelineVariablesFilter: ''
    }
  });
  const [fetchParams, setFetchParams] = useState<z.infer<typeof formSchema>>(
    form.getValues()
  );

  const pipelinesQuery = useInfiniteQuery({
    queryKey: ['pipelines', fetchParams],
    queryFn: ({ pageParam }) =>
      fetchPipelines(fetchParams.project, fetchParams.token, {
        page: pageParam,
        pipelineVariablesFilter: fetchParams.pipelineVariablesFilter
      }),
    retry: 0,
    initialPageParam: 1,
    getPreviousPageParam: (firstPage) => firstPage.paging?.prev,
    getNextPageParam: (lastPage) => lastPage.paging?.next,
    enabled: form.formState.isDirty && form.formState.isSubmitSuccessful
  });

  useEffect(() => {
    const storageValue = window.localStorage.getItem(FETCH_PARAMS_KEY);
    if (!storageValue) return;

    const parsed = formSchema.parse(JSON.parse(storageValue));
    for (const key in parsed) {
      const typedKey = key as keyof typeof parsed;
      form.setValue(typedKey, parsed[typedKey], { shouldDirty: true });
    }
  }, [form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    window.localStorage.setItem(FETCH_PARAMS_KEY, JSON.stringify(values));
    setFetchParams(values);
  }

  console.info(JSON.stringify(pipelinesQuery))

  return (
    <div className="w-full">
      <section>
        <h2 className="sr-only">Filter form</h2>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 w-full"
          >
            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="glpat_..."
                        {...field}
                        type="password"
                      />
                    </FormControl>
                    <FormDescription>
                      Fill this with your{' '}
                      <Link href="https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html">
                        Personal Access Token
                      </Link>
                      .
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="project"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Namespace</FormLabel>
                    <FormControl>
                      <Input placeholder="organization/project" {...field} />
                    </FormControl>
                    <FormDescription>
                      See the{' '}
                      <Link href="https://docs.gitlab.com/ee/api/rest/#namespaced-paths">
                        API reference
                      </Link>{' '}
                      for more information.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pipelineVariablesFilter"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Pipeline variables filter</FormLabel>
                  <FormControl>
                    <Input placeholder="HELLO=world,PING=pong" {...field} />
                  </FormControl>
                  <FormDescription>
                    Fill this with your pipeline variables that you want to
                    filter. The behavior of the filter is AND.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </section>

      {pipelinesQuery.isFetched && (
        <section className="mt-8 relative">
          <h2 className="sr-only">Pipelines list</h2>

          <div>
            <Table className="text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Pipeline link</TableHead>
                  <TableHead className="w-[250px]">Created at</TableHead>
                  <TableHead>Variables</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pipelinesQuery.error ? (
                  <TableRow>
                    <TableCell colSpan={4} className='text-muted-foreground'>
                      An error occurred, please try again.
                    </TableCell>
                  </TableRow>
                ) : (
                  pipelinesQuery.data?.pages.map((page) => (
                    <Fragment key={page.paging.next}>
                      {page.data.map((pipeline) => (
                        <TableRow key={pipeline.link}>
                          <TableCell className="font-medium">
                            <div className='flex gap-x-2 items-center'>
                              <Link href={pipeline.link}>{pipeline.link.split('/').at(-1)}</Link>

                              <Circle size={12} className={cn({
                                'fill-red-500 stroke-red-500': pipeline.status !== 'success',
                                'fill-green-500 stroke-green-500': pipeline.status === 'success',
                              })} />
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Intl.DateTimeFormat(
                              window.navigator.language,
                              {
                                dateStyle: 'medium',
                                timeStyle: 'long'
                              }
                            ).format(new Date(pipeline.createdAt))}
                          </TableCell>
                          <TableCell>
                            <ol className='list-decimal pl-4'>
                              {pipeline.variables.map((variable) => (
                                <li key={variable.key}>
                                  <span className="font-bold">
                                    {variable.key}:{' '}
                                  </span>{' '}
                                  {variable.value}
                                </li>
                              ))}
                            </ol>
                          </TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="flex items-center gap-x-4 mt-6">
              <Button
                onClick={() => pipelinesQuery.fetchNextPage()}
                variant="outline"
                disabled={!pipelinesQuery.hasNextPage}
              >
                Fetch more pipelines
              </Button>

              <CurrentPageInformation
                hasNext={pipelinesQuery.hasNextPage}
                pagesLength={pipelinesQuery.data?.pages.length}
              />
            </div>
          </div>

          {pipelinesQuery.isFetching && (
            <div className="w-full h-full flex items-center justify-center bg-white opacity-50 absolute top-0">
              <LoaderCircleIcon className="animate-spin" />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function CurrentPageInformation({
  pagesLength,
  hasNext
}: {
  pagesLength: number | undefined;
  hasNext: boolean;
}) {
  return (
    <div className="space-x-2 text-xs text-muted-foreground">
      <span>Current page: {pagesLength ?? 'N/A'}.</span>
      {!!pagesLength && !hasNext && <span>Maximum page reached.</span>}
    </div>
  );
}

async function fetchPipelines(
  namespace: string,
  token: string,
  opts: {
    pipelineVariablesFilter: string;
    page: number;
  }
): Promise<GitLabPipelinesResponse> {
  const { page, pipelineVariablesFilter } = opts;
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(page));

  if (pipelineVariablesFilter.length > 0) {
    const params = pipelineVariablesFilter
      .split(/,\s?/)
      .map((item) => item.split('='));
    for (const paramTuple of params) {
      if (paramTuple.length < 2) continue;

      searchParams.set(paramTuple[0], paramTuple[1]);
    }
  }

  const searchParamsString = `?${searchParams.toString()}`;

  const response = await fetch(
    `/api/gitlab/${encodeURIComponent(namespace)}/pipelines${searchParamsString}`,
    {
      headers: {
        'PRIVATE-TOKEN': token
      }
    }
  );
  const json = await response.json();

  if (response.status >= 400) {
    throw new Error(json.message)
  }

  return json
}

export const ListPipelines = () => (
  <QueryProvider>
    <ListPipelinesComponent />
  </QueryProvider>
);
