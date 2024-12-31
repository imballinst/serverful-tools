import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Link } from '@/components/Link';

const formSchema = z.object({
  token: z.string().min(1, 'Access token is required'),
  project: z.string().min(1, 'Project is required'),
  pipelineVariablesFilter: z.string()
});

export function ListPipelines() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token: '',
      project: '',
      pipelineVariablesFilter: ''
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <div className="w-full">
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
                    <Input placeholder="glpat_..." {...field} />
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

      <section></section>
    </div>
  );
}
