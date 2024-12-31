import { Link } from '@/components/Link';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
      </section>

      <section className="mt-8">
        <h2 className="sr-only">Pipelines list</h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">INV001</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Credit Card</TableCell>
              <TableCell className="text-right">$250.00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
